/**
 * @file lib/ai/image-generation.ts
 * Batch utility to generate AI thumbnails for exercises using Gemini image
 * generation and store them in Supabase Storage.
 *
 * Architecture:
 *   1. Fetch exercises where `ai_thumbnail_url IS NULL`
 *   2. For each exercise, call `gemini-2.5-flash-image`
 *      with a consistent style prompt matching the app's dark neon aesthetic
 *   3. Upload the resulting PNG bytes to the `exercise-thumbnails` Supabase
 *      Storage bucket (must be created as a **public** bucket beforehand)
 *   4. Update `ai_thumbnail_url` on the exercise row with the public CDN URL
 *
 * Note: `imagen-3.0-generate-001` requires Vertex AI and is NOT available
 * with standard Google AI Studio API keys. This file uses `generateContent`
 * with `responseModalities: ["IMAGE"]` which works with the standard key.
 *
 * Trigger via: GET /api/setup-images
 *
 * Rate limits:
 *   Gemini image generation free tier: ~10 req/min.
 *   `IMAGE_DELAY_MS` controls the sleep between requests.
 *   Increase to 7000 if you hit 429s.
 */

import { GoogleGenAI } from "@google/genai";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Gemini image generation model — GA, available via standard Google AI API key.
 * Previous models that NO LONGER work:
 *   - imagen-3.0-generate-001  → requires Vertex AI
 *   - gemini-2.0-flash-preview-image-generation → retired
 *   - gemini-2.0-flash-exp-image-generation     → retired
 */
const IMAGE_MODEL = "gemini-2.5-flash-image";

/** Target bucket in Supabase Storage (must be created as public) */
const STORAGE_BUCKET = "exercise-thumbnails";

/**
 * Delay between image generation API calls in milliseconds.
 * Imagen 3 free tier: ~10 req/min → 6 s spacing is safe.
 * Paid tier: reduce to 1000.
 */
const IMAGE_DELAY_MS = 6500;

/** Max retries on 429 / RESOURCE_EXHAUSTED */
const MAX_RETRIES = 3;

/** Default wait time when the API doesn't provide a retry-after hint */
const DEFAULT_RETRY_DELAY_MS = 60_000;

/**
 * Base style suffix appended to every prompt.
 * Keeps all thumbnails visually consistent with the app's dark neon aesthetic.
 */
const STYLE_SUFFIX =
    "minimalist flat digital illustration, dark black background, " +
    "neon green (#39ff14) accent lighting, clean athletic figure, " +
    "no text, no watermark, centered composition, high contrast";

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

/** Summary returned by `generateExerciseThumbnails()` */
export interface ThumbnailResult {
    processed: number;
    skipped: number;
    failed: number;
    failedIds: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGoogleAI(): GoogleGenAI {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        throw new Error(
            "[image-generation] Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable."
        );
    }
    return new GoogleGenAI({ apiKey });
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps an async call with retry logic for Google AI 429 rate-limit errors.
 * Mirrors the `callWithRetry` helper in `recommendations.ts`.
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
        const isRateLimit =
            message.includes("429") || message.includes("RESOURCE_EXHAUSTED");

        if (isRateLimit && retries > 0) {
            const retryMatch =
                message.match(/retryDelay[":\s]+(\d+)/i) ??
                message.match(/retry in ([\d.]+)s/i);
            const waitMs = retryMatch
                ? Math.ceil(parseFloat(retryMatch[1]) * 1000) + 2000
                : DEFAULT_RETRY_DELAY_MS;

            console.warn(
                `[callWithRetry] Rate limited on "${label}". ` +
                `Waiting ${Math.round(waitMs / 1000)}s (${retries} retries left)...`
            );

            await sleep(waitMs);
            return callWithRetry(label, fn, retries - 1);
        }

        throw error;
    }
}

/**
 * Builds the image generation prompt for a given exercise.
 *
 * Uses the English name (always available) for consistency — the vector DB
 * pattern from recommendations.ts does the same for `search_query`.
 */
function buildPrompt(exerciseName: string, primaryMuscle: string): string {
    return (
        `A person performing the "${exerciseName}" exercise, ` +
        `targeting the ${primaryMuscle} muscles. ` +
        STYLE_SUFFIX
    );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Batch-generates AI thumbnails for all exercises that don't have one yet.
 *
 * **Prerequisites:**
 * - Create a **public** bucket named `exercise-thumbnails` in Supabase Storage
 *   (Dashboard → Storage → New bucket → toggle "Public bucket" ON)
 *
 * **Usage:**
 *   GET /api/setup-images
 *
 * @returns Summary object with processed / skipped / failed counts.
 */
export async function generateExerciseThumbnails(): Promise<ThumbnailResult> {
    const result: ThumbnailResult = {
        processed: 0,
        skipped: 0,
        failed: 0,
        failedIds: [],
    };

    // Use the service role key to bypass RLS for admin storage uploads.
    // The anon key respects RLS and would be blocked from uploading to Storage.
    const supabase = createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
    const ai = getGoogleAI();

    // ── Step 1: Fetch exercises without a thumbnail ────────────────────────
    const { data: exercises, error: fetchError } = await supabase
        .from("exercises")
        .select("id, name, primary_muscle")
        .is("ai_thumbnail_url", null);

    if (fetchError) {
        console.error("[generateExerciseThumbnails] Fetch error:", fetchError.message);
        throw new Error(fetchError.message);
    }

    if (!exercises || exercises.length === 0) {
        console.log("[generateExerciseThumbnails] All exercises already have thumbnails.");
        return result;
    }

    console.log(`[generateExerciseThumbnails] Processing ${exercises.length} exercises...`);

    // ── Step 2: Generate + upload one by one ──────────────────────────────
    for (const exercise of exercises) {
        try {
            const prompt = buildPrompt(exercise.name, exercise.primary_muscle);

            // Generate image via Gemini image generation (standard API key compatible)
            const response = await callWithRetry(
                `generate image for "${exercise.name}"`,
                () =>
                    ai.models.generateContent({
                        model: IMAGE_MODEL,
                        contents: [{ role: "user", parts: [{ text: prompt }] }],
                        config: {
                            // TEXT must be included alongside IMAGE per API requirements
                            responseModalities: ["TEXT", "IMAGE"],
                        },
                    })
            );

            // Extract the inline image data from the response parts
            const imagePart = response.candidates?.[0]?.content?.parts?.find(
                (p) => p.inlineData?.data
            );
            const imageBase64 = imagePart?.inlineData?.data;
            const mimeType = imagePart?.inlineData?.mimeType ?? "image/png";

            if (!imageBase64) {
                throw new Error("No image bytes returned from Gemini image API");
            }

            // Convert base64 → Buffer for upload
            const imageBuffer = Buffer.from(imageBase64, "base64");
            const ext = mimeType === "image/jpeg" ? "jpg" : "png";
            const filePath = `${exercise.id}.${ext}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(filePath, imageBuffer, {
                    contentType: mimeType,
                    upsert: true,
                });

            if (uploadError) {
                throw new Error(`Storage upload failed: ${uploadError.message}`);
            }

            // Get the public CDN URL
            const { data: urlData } = supabase.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(filePath);

            // Update the exercise row
            const { error: updateError } = await supabase
                .from("exercises")
                .update({ ai_thumbnail_url: urlData.publicUrl })
                .eq("id", exercise.id);

            if (updateError) {
                throw new Error(`DB update failed: ${updateError.message}`);
            }

            result.processed++;
            console.log(
                `[generateExerciseThumbnails] ✓ ${exercise.name} → ${urlData.publicUrl}`
            );
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(
                `[generateExerciseThumbnails] ✗ ${exercise.name} (${exercise.id}): ${message}`
            );
            result.failed++;
            result.failedIds.push(exercise.id);
        }

        // Respect rate limits between requests
        await sleep(IMAGE_DELAY_MS);
    }

    console.log(
        `[generateExerciseThumbnails] Done. ` +
        `Processed: ${result.processed}, Skipped: ${result.skipped}, Failed: ${result.failed}`
    );

    return result;
}
