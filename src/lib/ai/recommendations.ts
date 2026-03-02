/**
 * @file lib/ai/recommendations.ts
 * AI-powered exercise recommendation service using RAG (Retrieval-Augmented Generation).
 *
 * ──────────────────────────────────────────────────────────────────────
 *  Architecture Overview
 * ──────────────────────────────────────────────────────────────────────
 *
 * This service is the bridge between:
 *   1. Supabase (data store + pgvector for similarity search)
 *   2. Google Generative AI (embeddings + text generation)
 *   3. The Home dashboard UI (consumes `RecommendedModule[]`)
 *
 * Two main functions:
 *
 *   generateExerciseEmbeddings()  — Batch utility to populate embeddings
 *   getRecommendedModules(userId, locale) — Per-request RAG pipeline for the Home page
 *
 * ──────────────────────────────────────────────────────────────────────
 *  RAG Pipeline (getRecommendedModules)
 * ──────────────────────────────────────────────────────────────────────
 *
 *   Step A: Fetch the user's profile → UserProfileContext
 *   Step B: Ask Gemini to generate 3 module structures with `search_query`
 *   Step C: Embed each search_query → 768-dim vectors
 *   Step D: Call `match_exercises` RPC per module (pgvector cosine search)
 *   Step E: Assemble RecommendedModule[] with real exercises
 *
 * ──────────────────────────────────────────────────────────────────────
 *  Environment Variables Required
 * ──────────────────────────────────────────────────────────────────────
 *
 *   GOOGLE_GENERATIVE_AI_API_KEY  — API key for Google AI
 *   NEXT_PUBLIC_SUPABASE_URL      — Already configured
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY — Already configured
 */

import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import type {
    RecommendedModule,
    RecommendedExercise,
    UserProfileContext,
    EmbeddingResult,
} from "@/lib/ai/types";
import type { Locale } from "@/i18n";

// ---------------------------------------------------------------------------
// Google AI Client
// ---------------------------------------------------------------------------

/**
 * Lazily initializes the Google Generative AI client.
 *
 * Uses a factory function so the module can be imported without immediately
 * requiring the API key (useful for type-checking and tests).
 *
 * @throws {Error} If `GOOGLE_GENERATIVE_AI_API_KEY` is not set at runtime.
 */
function getGoogleAI(): GoogleGenAI {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
        throw new Error(
            "[AI] Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable. " +
            "Add it to .env.local to enable AI features."
        );
    }

    return new GoogleGenAI({ apiKey });
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Embedding model — gemini-embedding-001 replaces the deprecated text-embedding-004 */
const EMBEDDING_MODEL = "gemini-embedding-001";

/**
 * Output dimensionality for embeddings.
 * `gemini-embedding-001` defaults to 3072 dims, but we truncate to 768
 * via MRL (Matryoshka Representation Learning) to match the existing
 * pgvector `vector(768)` column in Supabase.
 */
const EMBEDDING_DIMENSIONS = 768;

/** Model used for text generation (routine creation) */
const GENERATION_MODEL = "gemini-2.5-flash";

/** Number of exercises to retrieve per module via pgvector similarity search */
const EXERCISES_PER_MODULE = 5;

/** Minimum cosine similarity threshold for exercise matching */
const MATCH_THRESHOLD = 0.5;

/** Number of training modules to generate per request */
const MODULES_TO_GENERATE = 3;

/**
 * Delay between embedding API calls in milliseconds.
 * With paid credits, 1.5s spacing is sufficient.
 * Increase to ~4000 if on the unpaid free tier.
 */
const EMBEDDING_DELAY_MS = 1500;

/** Max number of retries for API calls that hit rate limits */
const MAX_RETRIES = 3;

/** Default wait time in ms when the API doesn't provide a retry-after hint */
const DEFAULT_RETRY_DELAY_MS = 45000;

/**
 * Gradient presets mapped by difficulty tier.
 * Each module gets a visually distinct card background matching the app's
 * dark theme with subtle color shifts.
 */
const DIFFICULTY_GRADIENTS: Record<string, string> = {
    Beginner:
        "linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 40%, #2e1a2e 100%)",
    Intermediate:
        "linear-gradient(135deg, #0d0d0d 0%, #1c1c1c 40%, #1a2e1a 100%)",
    Advanced:
        "linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 40%, #16213e 100%)",
};

// ---------------------------------------------------------------------------
// Rate Limit Helpers
// ---------------------------------------------------------------------------

/** Promise-based delay — used between API calls to respect rate limits. */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps an async API call with retry logic and exponential backoff.
 *
 * When the Google AI API returns a 429 (RESOURCE_EXHAUSTED), this helper:
 * 1. Parses the `retryDelay` hint from the error body (if present)
 * 2. Waits for that duration (or DEFAULT_RETRY_DELAY_MS)
 * 3. Retries up to MAX_RETRIES times
 *
 * This is essential for the free tier which has strict per-minute limits.
 *
 * @param label   - A human-readable label for logging (e.g. "embed exercise")
 * @param fn      - The async function to call
 * @param retries - Number of remaining retries (defaults to MAX_RETRIES)
 */
async function callWithRetry<T>(
    label: string,
    fn: () => Promise<T>,
    retries: number = MAX_RETRIES
): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const isRateLimit = message.includes("429") || message.includes("RESOURCE_EXHAUSTED");

        if (isRateLimit && retries > 0) {
            // Try to extract the retry delay from the error message.
            // Google's error JSON includes: "retryDelay":"40s"
            const retryMatch = message.match(/retryDelay[":\s]+(\d+)/i)
                ?? message.match(/retry in ([\d.]+)s/i);
            const waitMs = retryMatch
                ? Math.ceil(parseFloat(retryMatch[1]) * 1000) + 2000 // Add 2s buffer
                : DEFAULT_RETRY_DELAY_MS;

            console.warn(
                `[callWithRetry] Rate limited on "${label}". ` +
                `Waiting ${Math.round(waitMs / 1000)}s before retry (${retries} retries left)...`
            );

            await sleep(waitMs);
            return callWithRetry(label, fn, retries - 1);
        }

        // Non-rate-limit error or no retries left — rethrow
        throw error;
    }
}

// ---------------------------------------------------------------------------
// Internal Types
// ---------------------------------------------------------------------------

/**
 * Shape of each module that Gemini returns in Step B.
 * The LLM generates a JSON array of these, which we then enrich with
 * real exercises via pgvector in Steps C–D.
 */
interface GeminiModuleSchema {
    title: string;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    duration_minutes: number;
    match_percentage: number;
    search_query: string;
}

/**
 * Shape of each row returned by the `match_exercises` Supabase RPC.
 * Mirrors the `Returns` definition in `database.types.ts`.
 */
interface MatchedExerciseRow {
    id: string;
    name: string;
    name_es: string | null;
    description: string;
    description_es: string | null;
    primary_muscle: string;
    equipment: string;
    difficulty: string;
    similarity: number;
}

// ---------------------------------------------------------------------------
// generateExerciseEmbeddings()
// ---------------------------------------------------------------------------

/**
 * Batch utility that finds exercises without embeddings and generates
 * vector representations using Google's `text-embedding-004` model.
 *
 * **When to call this:**
 * - After seeding new exercises into the database
 * - As a cron job / admin action to keep embeddings up to date
 * - From a Route Handler (e.g. `POST /api/admin/embeddings`)
 *
 * **Pipeline per exercise:**
 * 1. Build a descriptive text: `"Name: {name}. Muscle: {muscle}. Desc: {desc}"`
 * 2. Call `text-embedding-004` → 768-dim float array
 * 3. Update the exercise row's `embedding` column in Supabase
 *
 * Individual failures don't abort the batch — they are logged and counted.
 *
 * @returns Summary of processed / skipped / failed exercises.
 */
export async function generateExerciseEmbeddings(): Promise<EmbeddingResult> {
    const result: EmbeddingResult = {
        processed: 0,
        skipped: 0,
        failed: 0,
        failedIds: [],
    };

    try {
        console.log("[generateExerciseEmbeddings] Starting batch embedding...");

        // ── Step 1: Fetch exercises without embeddings ────────────────────
        const supabase = await createClient();
        const { data: exercises, error: fetchError } = await supabase
            .from("exercises")
            .select("id, name, description, primary_muscle")
            .is("embedding", null);

        if (fetchError) {
            console.error("[generateExerciseEmbeddings] Fetch error:", fetchError.message);
            throw new Error(`Failed to fetch exercises: ${fetchError.message}`);
        }

        // Early return if all exercises already have embeddings
        if (!exercises || exercises.length === 0) {
            console.log("[generateExerciseEmbeddings] All exercises already have embeddings. Nothing to do.");
            return result;
        }

        console.log(`[generateExerciseEmbeddings] Found ${exercises.length} exercises without embeddings.`);

        // Initialize the Google AI client once for the entire batch
        const ai = getGoogleAI();

        // ── Step 2–4: Process each exercise ──────────────────────────────
        //   We add a delay (EMBEDDING_DELAY_MS) between calls to stay within
        //   the free-tier rate limit (~15 RPM for embeddings).
        for (let idx = 0; idx < exercises.length; idx++) {
            const exercise = exercises[idx];

            // Rate-limit spacing: pause before each call (except the first)
            if (idx > 0) {
                console.log(`[generateExerciseEmbeddings] Waiting ${EMBEDDING_DELAY_MS / 1000}s before next call...`);
                await sleep(EMBEDDING_DELAY_MS);
            }

            try {
                // Step 2: Build a descriptive text representation.
                const exerciseText = [
                    `Name: ${exercise.name}`,
                    `Muscle: ${exercise.primary_muscle}`,
                    `Description: ${exercise.description ?? "No description available"}`,
                ].join(". ");

                // Step 3: Generate embedding with retry logic for rate limits.
                const embeddingResponse = await callWithRetry(
                    `embed "${exercise.name}"`,
                    () => ai.models.embedContent({
                        model: EMBEDDING_MODEL,
                        contents: exerciseText,
                        config: { outputDimensionality: EMBEDDING_DIMENSIONS },
                    })
                );

                const vector = embeddingResponse.embeddings?.[0]?.values;

                if (!vector || vector.length === 0) {
                    console.warn(`[generateExerciseEmbeddings] Empty vector for exercise "${exercise.name}" (${exercise.id})`);
                    result.failed++;
                    result.failedIds.push(exercise.id);
                    continue;
                }

                // Step 4: Store the vector via RPC (bypasses RLS).
                //   The exercises table has RLS that requires `service_role`
                //   for UPDATE. Using a SECURITY DEFINER RPC avoids needing
                //   the service role key in the client.
                const vectorString = `[${vector.join(",")}]`;

                const { error: updateError } = await supabase
                    .rpc("update_exercise_embedding", {
                        exercise_id: exercise.id,
                        new_embedding: vectorString,
                    });

                if (updateError) {
                    console.error(`[generateExerciseEmbeddings] Update failed for "${exercise.name}":`, updateError.message);
                    result.failed++;
                    result.failedIds.push(exercise.id);
                    continue;
                }

                result.processed++;
                console.log(`[generateExerciseEmbeddings] ✓ Embedded "${exercise.name}" (${result.processed}/${exercises.length})`);
            } catch (exerciseError) {
                // Catch per-exercise errors so the batch continues
                const message = exerciseError instanceof Error ? exerciseError.message : String(exerciseError);
                console.error(`[generateExerciseEmbeddings] Error processing "${exercise.name}":`, message);
                result.failed++;
                result.failedIds.push(exercise.id);
            }
        }

        console.log(
            `[generateExerciseEmbeddings] Done. Processed: ${result.processed}, Failed: ${result.failed}, Skipped: ${result.skipped}`
        );
    } catch (globalError) {
        const message = globalError instanceof Error ? globalError.message : String(globalError);
        console.error("[generateExerciseEmbeddings] Fatal error:", message);
    }

    return result;
}

// ---------------------------------------------------------------------------
// getRecommendedModules() — Cache-aware entry point
// ---------------------------------------------------------------------------

/**
 * Returns personalized training modules for a user.
 *
 * **Cache layer:**
 * 1. Query `user_recommendations` for this user + locale combo.
 * 2. If found and fresh → parse JSONB → return immediately (~100ms).
 * 3. If not found → run the full Gemini + pgvector RAG pipeline,
 *    INSERT the result with today's date + locale, then return.
 *
 * The UNIQUE(user_id, date, locale) constraint guarantees at most one
 * generation per user per day per locale.
 *
 * @param userId - Authenticated user's UUID.
 * @param locale - The user's active locale ("en" or "es").
 * @returns Cached or freshly generated `RecommendedModule[]`.
 */
export async function getRecommendedModules(
    userId: string,
    locale: Locale = "en"
): Promise<RecommendedModule[]> {
    try {
        const supabase = await createClient();

        // ══════════════════════════════════════════════════════════════════
        // Step 0: Defense-in-depth — abort if onboarding is incomplete.
        // Page-level guards should catch this first, but this prevents
        // wasting Gemini tokens if a guard is somehow bypassed.
        // ══════════════════════════════════════════════════════════════════

        const { data: profile } = await supabase
            .from("profiles")
            .select("goal, level, weight_kg")
            .eq("id", userId)
            .maybeSingle();

        if (!profile?.goal || !profile?.level || profile?.weight_kg == null) {
            console.warn(
                "[getRecommendedModules] Profile incomplete — skipping RAG pipeline."
            );
            return [];
        }

        // ══════════════════════════════════════════════════════════════════
        // Step 1: Check the cache — valid for 7 days to save API tokens
        // ══════════════════════════════════════════════════════════════════

        /** How many days a cached recommendation set stays fresh */
        const CACHE_TTL_DAYS = 7;

        try {
            // Fetch the most recent recommendation for this user,
            // regardless of date — we'll compare freshness below.
            const { data: cached, error: cacheError } = await supabase
                .from("user_recommendations")
                .select("date, modules")
                .eq("user_id", userId)
                .eq("locale", locale)
                .order("date", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (cacheError) {
                // Log but don't abort — fall through to generation
                console.warn("[getRecommendedModules] Cache read error:", cacheError.message);
            } else if (cached?.modules && cached.date) {
                // Calculate age of the cached entry
                const cachedDate = new Date(cached.date);
                const now = new Date();
                const ageDays = Math.floor(
                    (now.getTime() - cachedDate.getTime()) / (1000 * 60 * 60 * 24)
                );

                if (ageDays < CACHE_TTL_DAYS) {
                    // ── Cache HIT ─────────────────────────────────────────
                    const modules = cached.modules as unknown as RecommendedModule[];
                    console.log(
                        `[getRecommendedModules] ✓ Cache HIT — ${modules.length} modules, ` +
                        `${ageDays}d old (TTL=${CACHE_TTL_DAYS}d).`
                    );
                    return modules;
                }

                console.log(
                    `[getRecommendedModules] Cache STALE — ${ageDays}d old (TTL=${CACHE_TTL_DAYS}d). Regenerating…`
                );
            }
        } catch (cacheReadError) {
            // Defensive: never let cache-read failures block generation
            const msg = cacheReadError instanceof Error ? cacheReadError.message : String(cacheReadError);
            console.warn("[getRecommendedModules] Cache read exception:", msg);
        }

        // ══════════════════════════════════════════════════════════════════
        // Step 2: Cache MISS / STALE — run the full RAG pipeline
        // ══════════════════════════════════════════════════════════════════

        const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
        console.log(`[getRecommendedModules] Cache MISS for ${today}. Running RAG pipeline...`);

        const modules = await _generateFreshModules(userId, supabase, locale);

        // ══════════════════════════════════════════════════════════════════
        // Step 3: Save to cache (fire-and-forget — don't block the response)
        // ══════════════════════════════════════════════════════════════════

        if (modules.length > 0) {
            try {
                const { error: insertError } = await supabase
                    .from("user_recommendations")
                    .upsert(
                        {
                            user_id: userId,
                            date: today,
                            locale,
                            modules: JSON.parse(JSON.stringify(modules)) as Json,
                        },
                        { onConflict: "user_id,date,locale" }
                    );

                if (insertError) {
                    console.warn("[getRecommendedModules] Cache write error:", insertError.message);
                } else {
                    console.log("[getRecommendedModules] ✓ Recommendations cached for", today);
                }
            } catch (cacheWriteError) {
                const msg = cacheWriteError instanceof Error ? cacheWriteError.message : String(cacheWriteError);
                console.warn("[getRecommendedModules] Cache write exception:", msg);
            }
        }

        return modules;
    } catch (fatalError) {
        // Top-level catch — ensures we never crash the Home page
        const message = fatalError instanceof Error ? fatalError.message : String(fatalError);
        console.error("[getRecommendedModules] Fatal error:", message);
        return [];
    }
}

// ---------------------------------------------------------------------------
// _generateFreshModules() — The actual RAG pipeline (internal)
// ---------------------------------------------------------------------------

/**
 * Runs the full Gemini + pgvector RAG pipeline to produce fresh modules.
 *
 * Extracted from `getRecommendedModules` so the public function can
 * focus on cache orchestration. This is never called directly from
 * outside this module.
 *
 * **Pipeline:**
 *   A) Fetch profile → UserProfileContext
 *   B) Gemini generates 3 module structures (title, difficulty, search_query)
 *   C) Embed each search_query via gemini-embedding-001
 *   D) Call match_exercises RPC per module (cosine similarity in Postgres)
 *   E) Assemble final RecommendedModule[] with real exercises
 */
async function _generateFreshModules(
    userId: string,
    supabase: Awaited<ReturnType<typeof createClient>>,
    locale: Locale = "en"
): Promise<RecommendedModule[]> {
    console.log(`[_generateFreshModules] Starting RAG pipeline for user: ${userId}`);

    const ai = getGoogleAI();

    // ══════════════════════════════════════════════════════════════════
    // Step A: Fetch user profile to build context
    // ══════════════════════════════════════════════════════════════════

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("goal, level, equipment, injuries, days_per_week, minutes_per_session")
        .eq("id", userId)
        .single();

    if (profileError || !profile) {
        console.error("[_generateFreshModules] Profile fetch error:", profileError?.message);
        return [];
    }

    // Build the UserProfileContext — these fields drive the LLM prompt
    const context: UserProfileContext = {
        goal: profile.goal ?? "health",
        level: profile.level ?? "beginner",
        equipment: profile.equipment ?? "bodyweight",
        injuries: profile.injuries ?? [],
        daysPerWeek: profile.days_per_week ?? 4,
        minutesPerSession: profile.minutes_per_session ?? 45,
    };

    console.log("[_generateFreshModules] User context:", JSON.stringify(context));

    // ══════════════════════════════════════════════════════════════════
    // Step B: Ask Gemini to generate module structures
    // ══════════════════════════════════════════════════════════════════

    // Build the locale instruction.
    // The title must be in the user's language, but search_query MUST
    // stay in English because it is embedded and matched against an
    // English embedding database (pgvector cosine search).
    const localeLabel = locale === "es" ? "Spanish" : "English";

    const modulePrompt = `You are an expert AI fitness coach. A user has the following profile:

- Fitness goal: ${context.goal}
- Experience level: ${context.level}
- Available equipment: ${context.equipment}
- Injuries to avoid: ${context.injuries.length > 0 ? context.injuries.join(", ") : "none"}
- Training frequency: ${context.daysPerWeek} days per week
- Session duration: ${context.minutesPerSession} minutes per session
- Preferred language: ${localeLabel} ('${locale}')

Generate exactly ${MODULES_TO_GENERATE} training modules. Each module should be a coherent workout (e.g. "Upper Body Push", "Leg Day", "Core Stability").

Return a JSON array with this exact structure:
[
  {
    "title": "MODULE NAME IN UPPERCASE",
    "difficulty": "Beginner" | "Intermediate" | "Advanced",
    "duration_minutes": <number between 20 and ${context.minutesPerSession}>,
    "match_percentage": <number between 80 and 99>,
    "search_query": "<A descriptive sentence about what exercises this module needs, including target muscles, movement patterns, and equipment. Example: 'compound push exercises for chest and shoulders using barbell and dumbbell'>"
  }
]

Rules:
- You MUST generate the "title" field in ${localeLabel}.
- The "search_query" field MUST be strictly in ENGLISH, as it will be used for vector matching against an English embedding database.
- Difficulty should match the user's level (${context.level}).
- match_percentage should reflect how well the module suits the user's goal.
- search_query must be specific enough to find relevant exercises via semantic search.
- Avoid exercises that target injured areas: ${context.injuries.length > 0 ? context.injuries.join(", ") : "none"}.
- Module names should be descriptive and motivating.
- Return ONLY the JSON array, no extra text.`;

    console.log("[_generateFreshModules] Calling Gemini for module structures...");

    const geminiResponse = await callWithRetry(
        "Gemini module generation",
        () => ai.models.generateContent({
            model: GENERATION_MODEL,
            contents: modulePrompt,
            config: { responseMimeType: "application/json" },
        })
    );

    // Parse the LLM's JSON response
    const rawText = geminiResponse.text ?? "";

    if (!rawText) {
        console.error("[_generateFreshModules] Gemini returned empty response.");
        return [];
    }

    let geminiModules: GeminiModuleSchema[];

    try {
        geminiModules = JSON.parse(rawText) as GeminiModuleSchema[];
    } catch (parseError) {
        console.error("[_generateFreshModules] Failed to parse Gemini JSON:", rawText.slice(0, 500));
        return [];
    }

    if (!Array.isArray(geminiModules) || geminiModules.length === 0) {
        console.error("[_generateFreshModules] Gemini returned invalid module array:", geminiModules);
        return [];
    }

    console.log(`[_generateFreshModules] Gemini generated ${geminiModules.length} modules.`);

    // ══════════════════════════════════════════════════════════════════
    // Steps C + D: Embed search queries & match exercises per module
    // ══════════════════════════════════════════════════════════════════

    const assembledModules: RecommendedModule[] = [];

    for (let i = 0; i < geminiModules.length; i++) {
        const mod = geminiModules[i];

        try {
            console.log(`[_generateFreshModules] Processing module ${i + 1}: "${mod.title}"`);
            console.log(`[_generateFreshModules]   search_query: "${mod.search_query}"`);

            // Delay between embedding calls to avoid rate limits
            if (i > 0) {
                await sleep(EMBEDDING_DELAY_MS);
            }

            // Step C: Embed the search_query with retry logic.
            const queryEmbedding = await callWithRetry(
                `embed module search_query "${mod.title}"`,
                () => ai.models.embedContent({
                    model: EMBEDDING_MODEL,
                    contents: mod.search_query,
                    config: { outputDimensionality: EMBEDDING_DIMENSIONS },
                })
            );

            const queryVector = queryEmbedding.embeddings?.[0]?.values;

            if (!queryVector || queryVector.length === 0) {
                console.warn(`[_generateFreshModules] Empty embedding for module "${mod.title}". Skipping.`);
                continue;
            }

            // Step D: Call match_exercises RPC.
            const vectorString = `[${queryVector.join(",")}]`;

            const { data: matchedExercises, error: rpcError } = await supabase
                .rpc("match_exercises", {
                    query_embedding: vectorString,
                    match_threshold: MATCH_THRESHOLD,
                    match_count: EXERCISES_PER_MODULE,
                });

            if (rpcError) {
                console.error(`[_generateFreshModules] RPC error for module "${mod.title}":`, rpcError.message);
                continue;
            }

            if (!matchedExercises || matchedExercises.length === 0) {
                console.warn(`[_generateFreshModules] No exercises matched for module "${mod.title}".`);
                continue;
            }

            console.log(`[_generateFreshModules]   Matched ${matchedExercises.length} exercises.`);

            // ════════════════════════════════════════════════════════════════
            // Step E: Assemble the final RecommendedModule
            // ════════════════════════════════════════════════════════════════

            const exercises: RecommendedExercise[] = (matchedExercises as MatchedExerciseRow[]).map(
                (ex) => ({
                    id: ex.id,
                    name: ex.name,
                    primaryMuscle: ex.primary_muscle as RecommendedExercise["primaryMuscle"],
                    sets: getSetsForGoal(context.goal, context.level),
                    reps: getRepsForGoal(context.goal, context.level),
                    restSeconds: getRestForGoal(context.goal),
                })
            );

            const difficulty = normalizeDifficulty(mod.difficulty);

            const module: RecommendedModule = {
                id: `module-${i}-${Date.now()}`,
                name: mod.title,
                matchPercent: clamp(mod.match_percentage, 0, 100),
                difficulty,
                exerciseCount: exercises.length,
                durationMin: mod.duration_minutes,
                gradient: DIFFICULTY_GRADIENTS[difficulty] ?? DIFFICULTY_GRADIENTS.Beginner,
                exercises,
            };

            assembledModules.push(module);

            console.log(
                `[_generateFreshModules]   ✓ Module "${mod.title}" assembled with ${exercises.length} exercises.`
            );
        } catch (moduleError) {
            const message = moduleError instanceof Error ? moduleError.message : String(moduleError);
            console.error(`[_generateFreshModules] Error processing module "${mod.title}":`, message);
        }
    }

    // Sort by match percentage, highest first
    assembledModules.sort((a, b) => b.matchPercent - a.matchPercent);

    console.log(
        `[_generateFreshModules] Pipeline complete. Returning ${assembledModules.length} modules.`
    );

    return assembledModules;
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Returns the recommended number of sets based on the user's fitness goal
 * and experience level. More advanced users get slightly higher volume.
 *
 * - lose_fat / health  → moderate volume (3–4 sets)
 * - build_muscle       → higher volume (3–4 sets)
 * - strength           → moderate sets, heavier weight (3–5 sets)
 * - performance        → varies (3–4 sets)
 */
function getSetsForGoal(
    goal: UserProfileContext["goal"],
    level: UserProfileContext["level"]
): number {
    const isAdvanced = level === "advanced" || level === "elite";

    switch (goal) {
        case "strength":
            return isAdvanced ? 5 : 3;
        case "build_muscle":
            return isAdvanced ? 4 : 3;
        case "lose_fat":
        case "health":
        case "performance":
        default:
            return isAdvanced ? 4 : 3;
    }
}

/**
 * Returns the recommended rep range string based on the user's goal.
 *
 * - strength       → low reps, heavy (3–5)
 * - build_muscle   → hypertrophy range (8–12)
 * - lose_fat       → moderate-high (12–15) for metabolic effect
 * - health         → general fitness (10–12)
 * - performance    → varied (6–10)
 */
function getRepsForGoal(
    goal: UserProfileContext["goal"],
    level: UserProfileContext["level"]
): string {
    const isAdvanced = level === "advanced" || level === "elite";

    switch (goal) {
        case "strength":
            return isAdvanced ? "3-5" : "5-6";
        case "build_muscle":
            return isAdvanced ? "8-12" : "10-12";
        case "lose_fat":
            return "12-15";
        case "performance":
            return isAdvanced ? "6-8" : "8-10";
        case "health":
        default:
            return "10-12";
    }
}

/**
 * Returns the recommended rest period in seconds based on the user's goal.
 *
 * - strength     → longer rest (180s) for neural recovery
 * - build_muscle → moderate rest (90s) for hypertrophy
 * - lose_fat     → short rest (60s) for metabolic effect
 * - others       → moderate (90s)
 */
function getRestForGoal(goal: UserProfileContext["goal"]): number {
    switch (goal) {
        case "strength":
            return 180;
        case "build_muscle":
            return 90;
        case "lose_fat":
            return 60;
        case "performance":
            return 90;
        case "health":
        default:
            return 90;
    }
}

/**
 * Normalizes a difficulty string from the LLM to our strict union type.
 * Handles edge cases where Gemini might return unexpected casing or values.
 */
function normalizeDifficulty(raw: string): "Beginner" | "Intermediate" | "Advanced" {
    const lower = raw.toLowerCase();
    if (lower.includes("advanced")) return "Advanced";
    if (lower.includes("intermediate")) return "Intermediate";
    return "Beginner";
}

/**
 * Clamps a number between min and max (inclusive).
 * Used to ensure match_percentage stays in the 0-100 range.
 */
function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, Math.round(value)));
}
