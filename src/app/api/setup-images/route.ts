/**
 * @file app/api/setup-images/route.ts
 * One-shot admin endpoint to generate AI thumbnails for all exercises
 * that don't have one yet.
 *
 * Prerequisites:
 *   1. Create a **public** bucket named `exercise-thumbnails` in Supabase Storage
 *      (Dashboard → Storage → New bucket → enable "Public bucket")
 *   2. Ensure GOOGLE_GENERATIVE_AI_API_KEY is set in .env.local
 *
 * Usage:
 *   GET /api/setup-images
 *
 * The response is a JSON summary: { processed, skipped, failed, failedIds }
 *
 * Note: Generation is slow (~6.5s per image due to Imagen rate limits).
 * For 150 exercises this takes ~15 minutes — run it once and forget it.
 */

import { generateExerciseThumbnails } from "@/lib/ai/image-generation";

/** Allow up to 5 minutes — needed for large batches on first run */
export const maxDuration = 300;

export async function GET(request: Request) {
    // Protect admin endpoint — requires ADMIN_SECRET query param
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret || secret !== adminSecret) {
        return Response.json(
            { success: false, error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        console.log("[setup-images] Starting thumbnail generation...");

        const result = await generateExerciseThumbnails();

        console.log("[setup-images] Done:", JSON.stringify(result));

        return Response.json({
            success: true,
            ...result,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[setup-images] Error:", message);

        return Response.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
