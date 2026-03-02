/**
 * @file app/api/setup-ai/route.ts
 * One-shot admin endpoint to generate embeddings for all exercises.
 *
 * Visit `GET /api/setup-ai` in the browser to trigger the batch.
 * The response is a JSON summary: { processed, skipped, failed, failedIds }.
 *
 * **Security note:** This is intentionally unprotected for initial setup.
 * In production, wrap it with an auth check or remove it entirely
 * once all exercises are embedded.
 */

import { generateExerciseEmbeddings } from "@/lib/ai/recommendations";

export const maxDuration = 120; // Allow up to 2 minutes for large batches

export async function GET() {
    try {
        console.log("[setup-ai] Starting embedding generation...");

        const result = await generateExerciseEmbeddings();

        console.log("[setup-ai] Done:", JSON.stringify(result));

        return Response.json({
            success: true,
            ...result,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[setup-ai] Error:", message);

        return Response.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
