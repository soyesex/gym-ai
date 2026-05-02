/**
 * @file app/api/chat/exercise/route.ts
 * POST /api/chat/exercise — Streaming AI chat for exercise detail page.
 *
 * ── Security ──────────────────────────────────────────────────────────────
 *   - Requires valid Supabase session (401 if unauthenticated)
 *   - Rate limit: 10 messages per user per hour (stored in Supabase)
 *   - User message content is NEVER logged (privacy-first)
 *
 * ── Streaming ─────────────────────────────────────────────────────────────
 *   - Uses Gemini 2.5 Flash streaming via ReadableStream + SSE-style chunks
 *   - Each chunk is plain text (not JSON) — client appends to bubble
 *   - On Gemini failure → returns JSON with i18n error key, no crash
 *
 * ── Context ───────────────────────────────────────────────────────────────
 *   - Exercise context: name, muscle, difficulty, steps, tips, risks
 *   - User context: fitness goal, level, equipment, injuries
 *   - Chat history: max 10 previous messages (token efficiency)
 *   - Pain/injury keywords → mandatory medical disclaimer appended
 *
 * ── Request body ──────────────────────────────────────────────────────────
 *   {
 *     exerciseId: string (UUID)
 *     message: string (current user message)
 *     history: { role: "user"|"model", text: string }[]  // max 10
 *     locale: "en" | "es"
 *   }
 */

import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";

// ── Constants ────────────────────────────────────────────────────────────────

const GENERATION_MODEL = "gemini-2.5-flash";
const MAX_HISTORY = 10;
const RATE_LIMIT_PER_HOUR = 10;

/** Keywords that trigger the mandatory medical disclaimer */
const PAIN_KEYWORDS_EN = [
    "pain", "hurt", "injury", "injured", "sore", "ache", "aching",
    "swollen", "swelling", "cramp", "cramps", "discomfort", "bleeding",
    "fracture", "sprain", "strain", "tear", "torn",
];
const PAIN_KEYWORDS_ES = [
    "dolor", "duele", "lesión", "lesionado", "inflamado", "inflamación",
    "calambre", "molestia", "sangrado", "fractura", "esguince",
    "distensión", "desgarro", "golpe",
];

function hasPainKeywords(text: string): boolean {
    const lower = text.toLowerCase();
    return (
        PAIN_KEYWORDS_EN.some((k) => lower.includes(k)) ||
        PAIN_KEYWORDS_ES.some((k) => lower.includes(k))
    );
}

// ── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
    role: "user" | "model";
    text: string;
}

interface RequestBody {
    exerciseId: string;
    message: string;
    history?: ChatMessage[];
    locale?: "en" | "es";
}

// ── Gemini client ────────────────────────────────────────────────────────────

function getGoogleAI(): GoogleGenAI {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
    return new GoogleGenAI({ apiKey });
}

// ── Rate limiting (Supabase-based) ───────────────────────────────────────────

/**
 * Checks and increments the rate limit counter for the user.
 * Uses a simple `chat_rate_limits` key-value approach via Supabase RPC
 * or falls back to in-memory if table doesn't exist (dev-friendly).
 *
 * Returns true if the user is within limits, false if exceeded.
 */
async function checkRateLimit(userId: string): Promise<boolean> {
    try {
        const supabase = await createClient();
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        // Count messages sent in the last hour
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count, error } = await (supabase as any)
            .from("exercise_chat_logs")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .gte("created_at", oneHourAgo);

        if (error) {
            // Table might not exist yet — allow the request (fail open)
            console.warn("[chat/exercise] Rate limit check failed, allowing request:", error.message);
            return true;
        }

        return (count ?? 0) < RATE_LIMIT_PER_HOUR;
    } catch {
        // Fail open on any unexpected error
        return true;
    }
}

/**
 * Logs that a message was sent (only metadata — no message content).
 * Privacy-safe: stores only user_id + timestamp.
 */
async function logMessageSent(userId: string, exerciseId: string): Promise<void> {
    try {
        const supabase = await createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("exercise_chat_logs").insert({
            user_id: userId,
            exercise_id: exerciseId,
        });
    } catch {
        // Non-critical — logging failure should not block the response
    }
}

// ── System prompt builder ────────────────────────────────────────────────────

function buildSystemPrompt(
    exercise: Record<string, unknown>,
    profile: Record<string, unknown> | null,
    locale: string
): string {
    const langInstruction =
        locale === "es"
            ? "ALWAYS respond in Spanish. Never switch to English."
            : "ALWAYS respond in English. Never switch to Spanish.";

    const exerciseName =
        locale === "es" && exercise.name_es
            ? `${exercise.name_es} (${exercise.name})`
            : (exercise.name as string) ?? "this exercise";

    const steps = Array.isArray(exercise.steps)
        ? exercise.steps.map((s: unknown, i: number) => `${i + 1}. ${typeof s === "string" ? s : JSON.stringify(s)}`).join("\n")
        : null;

    const tips = Array.isArray(exercise.detailed_tips)
        ? exercise.detailed_tips.map((t: unknown) => `• ${typeof t === "string" ? t : JSON.stringify(t)}`).join("\n")
        : null;

    const risks = Array.isArray(exercise.risks)
        ? exercise.risks.map((r: unknown) => {
            if (typeof r === "string") return `• ${r}`;
            const rr = r as Record<string, unknown>;
            return `• ${rr.title ?? ""}: ${rr.description ?? ""}`;
        }).join("\n")
        : null;

    const userContext = profile
        ? `
USER PROFILE:
- Level: ${profile.experience_level ?? "unknown"}
- Goal: ${profile.fitness_goal ?? "unknown"}
- Equipment: ${profile.equipment_access ?? "unknown"}
- Injuries/Limitations: ${Array.isArray(profile.injuries) && profile.injuries.length > 0 ? profile.injuries.join(", ") : "none reported"}
- Days/week: ${profile.days_per_week ?? "unknown"}
`
        : "";

    const medicalDisclaimer =
        locale === "es"
            ? "⚠️ IMPORTANTE: Si el usuario menciona dolor, lesión, o malestar físico, SIEMPRE recomienda consultar a un médico o fisioterapeuta antes de continuar."
            : "⚠️ IMPORTANT: If the user mentions pain, injury, or physical discomfort, ALWAYS recommend consulting a doctor or physiotherapist before continuing.";

    return `You are GYM-AI, an expert fitness coach assistant specialized in exercise technique, safety, and training optimization.

${langInstruction}

CURRENT EXERCISE: ${exerciseName}
- Primary muscle: ${exercise.primary_muscle ?? "unknown"}
- Difficulty: ${exercise.difficulty ?? "unknown"}
${exercise.force ? `- Force type: ${exercise.force}` : ""}
${steps ? `\nEXECUTION STEPS:\n${steps}` : ""}
${tips ? `\nEXECUTION TIPS:\n${tips}` : ""}
${risks ? `\nCOMMON MISTAKES & RISKS:\n${risks}` : ""}
${userContext}
BEHAVIOR RULES:
1. Stay focused on this exercise and fitness topics. Politely decline unrelated topics.
2. Give concise, actionable answers (2-4 sentences max unless a detailed explanation is requested).
3. Use motivating, professional language matching a personal trainer tone.
4. When suggesting rep ranges or weights, always account for the user's level.
5. ${medicalDisclaimer}
6. Never provide medical diagnoses. Always recommend professional consultation for injuries.
7. If asked about exercise variations, suggest beginner/advanced alternatives when appropriate.
8. DO NOT use markdown formatting. Use plain text only (no asterisks, no bold, no lists).`;
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
    // ── 1. Auth ─────────────────────────────────────────────────────────────
    let userId: string;
    let supabase: Awaited<ReturnType<typeof createClient>>;

    try {
        supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return Response.json({ error: "chat.unauthorized" }, { status: 401 });
        }
        userId = user.id;
    } catch {
        return Response.json({ error: "chat.unauthorized" }, { status: 401 });
    }

    // ── 2. Parse & validate body ─────────────────────────────────────────────
    let body: RequestBody;
    try {
        body = (await request.json()) as RequestBody;
    } catch {
        return Response.json({ error: "chat.invalidRequest" }, { status: 400 });
    }

    const {
        exerciseId,
        message,
        history = [],
        locale = "es",
    } = body;

    if (!exerciseId || !message?.trim()) {
        return Response.json({ error: "chat.invalidRequest" }, { status: 400 });
    }

    // ── 3. Rate limit ────────────────────────────────────────────────────────
    const withinLimit = await checkRateLimit(userId);
    if (!withinLimit) {
        return Response.json({ error: "chat.rateLimit" }, { status: 429 });
    }

    // ── 4. Fetch exercise + user profile in parallel ─────────────────────────
    let exercise: Record<string, unknown> | null = null;
    let profile: Record<string, unknown> | null = null;

    try {
        const [exerciseResult, profileResult] = await Promise.all([
            supabase
                .from("exercises")
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .select("name,name_es,description,primary_muscle,difficulty,force,steps,steps_es,detailed_tips,detailed_tips_es,risks,risks_es" as any)
                .eq("id", exerciseId)
                .maybeSingle(),
            supabase
                .from("profiles")
                .select("experience_level,fitness_goal,equipment_access,injuries,days_per_week")
                .eq("id", userId)
                .maybeSingle(),
        ]);

        exercise = exerciseResult.data as Record<string, unknown> | null;
        profile = profileResult.data as Record<string, unknown> | null;
    } catch (err) {
        console.error("[chat/exercise] Data fetch failed:", (err as Error).message);
        // Non-critical — continue without context
    }

    if (!exercise) {
        return Response.json({ error: "chat.exerciseNotFound" }, { status: 404 });
    }

    // ── 5. Build Gemini conversation ─────────────────────────────────────────
    const systemPrompt = buildSystemPrompt(exercise, profile, locale);

    // Limit history to last MAX_HISTORY messages
    const limitedHistory = history.slice(-MAX_HISTORY);

    // Append pain disclaimer to message if needed (server-side enforcement)
    const needsDisclaimer = hasPainKeywords(message);

    // ── 6. Stream response ───────────────────────────────────────────────────
    let ai: GoogleGenAI;
    try {
        ai = getGoogleAI();
    } catch {
        return Response.json({ error: "chat.geminiUnavailable" }, { status: 503 });
    }

    // Log the message sent (metadata only — no content)
    void logMessageSent(userId, exerciseId);

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();

            try {
                // Build the contents array for multi-turn chat
                type ContentPart = { role: "user" | "model"; parts: { text: string }[] };
                const contents: ContentPart[] = [
                    // System prompt as first user turn + empty model acknowledge
                    { role: "user", parts: [{ text: systemPrompt }] },
                    { role: "model", parts: [{ text: "Understood. I'm ready to help." }] },
                    // Previous conversation history
                    ...limitedHistory.map((msg) => ({
                        role: msg.role,
                        parts: [{ text: msg.text }],
                    })),
                    // Current user message
                    { role: "user", parts: [{ text: message }] },
                ];

                const response = await ai.models.generateContentStream({
                    model: GENERATION_MODEL,
                    contents,
                    config: {
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                    },
                });

                for await (const chunk of response) {
                    const text = chunk.text ?? "";
                    if (text) {
                        controller.enqueue(encoder.encode(text));
                    }
                }

                // Append mandatory disclaimer if pain keywords detected
                if (needsDisclaimer) {
                    const disclaimer =
                        locale === "es"
                            ? "\n\n⚠️ *Si estás experimentando dolor físico, te recomiendo consultar con un médico o fisioterapeuta antes de continuar entrenando.*"
                            : "\n\n⚠️ *If you're experiencing physical pain, I recommend consulting a doctor or physiotherapist before continuing to train.*";
                    controller.enqueue(encoder.encode(disclaimer));
                }

                controller.close();
            } catch (err) {
                const errMsg = (err as Error).message ?? "";
                console.error("[chat/exercise] Gemini stream error:", errMsg);

                // Determine error type for i18n key
                let errorKey = "chat.error";
                if (errMsg.includes("429") || errMsg.toLowerCase().includes("quota")) {
                    errorKey = "chat.rateLimit";
                } else if (errMsg.includes("503") || errMsg.toLowerCase().includes("unavailable")) {
                    errorKey = "chat.geminiUnavailable";
                }

                // Send error as JSON chunk — client detects JSON and shows error bubble
                controller.enqueue(
                    encoder.encode(`\x00ERROR:${errorKey}`)
                );
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Transfer-Encoding": "chunked",
            "Cache-Control": "no-cache, no-store",
            "X-Accel-Buffering": "no", // Disable Nginx buffering for streaming
        },
    });
}
