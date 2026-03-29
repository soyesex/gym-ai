/**
 * @file app/api/setup-exercise-details/route.ts
 * One-shot batch endpoint to generate exercise detail content with Gemini.
 *
 * Generates for each exercise that lacks `steps`:
 *   - steps / steps_es        — ordered execution steps (EN + ES)
 *   - risks / risks_es        — common mistakes
 *   - detailed_tips / _es     — execution tips
 *   - youtube_url             — YouTube search URL
 *
 * Usage: GET /api/setup-exercise-details
 * Re-running is SAFE — only processes exercises with steps = NULL.
 *
 * Fixes:
 *   - Uses createAdminClient() (service_role) → bypasses RLS on exercises table
 *   - maxOutputTokens: 2048 + thinkingBudget: 0 → no token truncation
 *   - repairAndParse() → handles truncated JSON gracefully
 *   - Verbose logging before AND after every DB update
 */

import { GoogleGenAI } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 300;

// ── Gemini setup ─────────────────────────────────────────────────────────────

const GENERATION_MODEL = "gemini-2.5-flash";
const DELAY_MS = 2000;

function getGoogleAI(): GoogleGenAI {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
    return new GoogleGenAI({ apiKey });
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Types ────────────────────────────────────────────────────────────────────

interface ExerciseStep { en: string; es: string; }
interface ExerciseRisk {
    title: string; title_es: string;
    description: string; description_es: string;
    avoid: string; avoid_es: string;
}
interface ExerciseTip { en: string; es: string; }
interface GeneratedContent {
    steps: ExerciseStep[];
    risks: ExerciseRisk[];
    detailed_tips: ExerciseTip[];
}

// ── Prompt ────────────────────────────────────────────────────────────────────

function buildPrompt(
    name: string,
    nameEs: string | null,
    primaryMuscle: string,
    difficulty: string | null
): string {
    return `You are an expert fitness coach. Generate exercise content for: "${name}" (ES: "${nameEs ?? name}"), muscle: ${primaryMuscle}, level: ${difficulty ?? "intermediate"}.

IMPORTANT: Return ONLY valid JSON. No markdown, no code blocks, no extra text.

Required structure:
{"steps":[{"en":"string","es":"string"}],"risks":[{"title":"string","title_es":"string","description":"string","description_es":"string","avoid":"string","avoid_es":"string"}],"detailed_tips":[{"en":"Title: body","es":"Título: cuerpo"}]}

Content requirements:
- steps: exactly 4 steps. Each under 100 chars. Clear and safe.
- risks: exactly 2 common mistakes that reduce effectiveness or cause injury.
- detailed_tips: exactly 3 tips in "Title: body" format. Each under 80 chars.
- ALL fields required. Both "en" and "es" for every item.`;
}

// ── Robust JSON parser ────────────────────────────────────────────────────────

function repairAndParse(rawText: string): GeneratedContent | null {
    // Strip markdown code fences
    let text = rawText.trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    // 1. Direct parse
    try { return JSON.parse(text) as GeneratedContent; } catch { /* continue */ }

    // 2. Extract first JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try { return JSON.parse(jsonMatch[0]) as GeneratedContent; } catch { /* continue */ }
    }

    // 3. Repair truncated JSON
    // 3a. Remove trailing comma or incomplete key
    text = text.replace(/,\s*"[^"]*$/, "").replace(/,\s*$/, "");

    // 3b. Close unclosed string literal (odd number of unescaped quotes)
    let inString = false;
    let escaped = false;
    for (const ch of text) {
        if (escaped) { escaped = false; continue; }
        if (ch === "\\") { escaped = true; continue; }
        if (ch === '"') inString = !inString;
    }
    if (inString) text += '"';

    // 3c. Remove incomplete key without value
    text = text.replace(/,\s*"[^"]+"\s*:\s*$/, "");
    text = text.replace(/,\s*$/, "");

    // 3d. Close open brackets/braces
    const stack: string[] = [];
    for (const ch of text) {
        if (ch === "{" || ch === "[") stack.push(ch);
        else if (ch === "}" || ch === "]") stack.pop();
    }
    const closers = stack.reverse().map((c) => (c === "[" ? "]" : "}")).join("");
    if (closers) {
        try {
            const parsed = JSON.parse(text + closers) as GeneratedContent;
            if (Array.isArray(parsed.steps) && parsed.steps.length > 0) return parsed;
        } catch { /* give up */ }
    }

    return null;
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function GET() {
    const result = {
        processed: 0,
        skipped: 0,
        failed: 0,
        failedIds: [] as string[],
    };

    try {
        // ── Use admin client (service_role) to bypass RLS ─────────────────────
        // The exercises table has RLS that blocks regular anon/user updates.
        // createAdminClient() uses SUPABASE_SERVICE_ROLE_KEY → full access.
        const supabase = createAdminClient();

        // Fetch exercises without steps (idempotent — safe to re-run)
        const { data: exercises, error: fetchError } = await supabase
            .from("exercises")
            .select("id, name, name_es, description, primary_muscle, difficulty")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .is("steps" as any, null);

        if (fetchError) {
            console.error("[setup-exercise-details] Fetch error:", fetchError.message);
            return Response.json({ success: false, error: fetchError.message }, { status: 500 });
        }

        if (!exercises || exercises.length === 0) {
            console.log("[setup-exercise-details] All exercises already processed.");
            return Response.json({ success: true, message: "All exercises already processed.", ...result });
        }

        console.log(`[setup-exercise-details] Found ${exercises.length} to process (using admin client).`);
        const ai = getGoogleAI();

        for (let idx = 0; idx < exercises.length; idx++) {
            const ex = exercises[idx];

            if (idx > 0) {
                console.log(`[setup-exercise-details] Waiting ${DELAY_MS / 1000}s...`);
                await sleep(DELAY_MS);
            }

            try {
                console.log(`[setup-exercise-details] Processing ${idx + 1}/${exercises.length}: "${ex.name}"`);

                // ── Call Gemini ───────────────────────────────────────────────
                const response = await ai.models.generateContent({
                    model: GENERATION_MODEL,
                    contents: buildPrompt(
                        ex.name,
                        ex.name_es ?? null,
                        ex.primary_muscle,
                        ex.difficulty ?? null
                    ),
                    config: {
                        responseMimeType: "application/json",
                        maxOutputTokens: 2048,
                        temperature: 0.3,
                        thinkingConfig: { thinkingBudget: 0 }, // disable thinking → all tokens for JSON
                    },
                });

                const rawText = response.text ?? "";

                // ── Log first 150 chars of Gemini response for debugging ──────
                console.log(`[setup-exercise-details] Gemini response (${rawText.length} chars): ${rawText.slice(0, 150)}`);

                if (!rawText) {
                    console.warn(`[setup-exercise-details] Empty response for "${ex.name}"`);
                    result.failed++;
                    result.failedIds.push(ex.id);
                    continue;
                }

                // ── Parse / repair JSON ───────────────────────────────────────
                const content = repairAndParse(rawText);

                if (!content || !Array.isArray(content.steps) || content.steps.length === 0) {
                    console.error(`[setup-exercise-details] Parse failed for "${ex.name}". Raw: ${rawText.slice(0, 300)}`);
                    result.failed++;
                    result.failedIds.push(ex.id);
                    continue;
                }

                console.log(`[setup-exercise-details] Parsed OK: ${content.steps.length} steps, ${content.risks?.length ?? 0} risks, ${content.detailed_tips?.length ?? 0} tips`);

                // ── Build update payload ──────────────────────────────────────
                const steps_en = content.steps.map((s) => s.en ?? "").filter(Boolean);
                const steps_es = content.steps.map((s) => s.es ?? "").filter(Boolean);
                const tips_en = (content.detailed_tips ?? []).map((t) => t.en ?? "").filter(Boolean);
                const tips_es = (content.detailed_tips ?? []).map((t) => t.es ?? "").filter(Boolean);
                const risks = content.risks ?? [];

                const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
                    `${ex.name} proper form tutorial`
                )}`;

                // ── Update Supabase via admin client ──────────────────────────
                // Cast payload to bypass database.types.ts (pre-migration types)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const updatePayload: Record<string, any> = {
                    steps: steps_en,
                    steps_es: steps_es,
                    risks: risks,
                    risks_es: risks,
                    detailed_tips: tips_en,
                    detailed_tips_es: tips_es,
                    youtube_url: youtubeUrl,
                };

                const { error: updateError, count } = await supabase
                    .from("exercises")
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .update(updatePayload as any)
                    .eq("id", ex.id);

                // ── Log update result ─────────────────────────────────────────
                if (updateError) {
                    console.error(`[setup-exercise-details] ✗ DB update failed for "${ex.name}": ${updateError.message} (code: ${updateError.code})`);
                    result.failed++;
                    result.failedIds.push(ex.id);
                    continue;
                }

                console.log(`[setup-exercise-details] ✓ DB updated for "${ex.name}" (count: ${count ?? "n/a"})`);
                result.processed++;
                console.log(`[setup-exercise-details] ✓ "${ex.name}" (${result.processed}/${exercises.length})`);

            } catch (exerciseError) {
                const msg = exerciseError instanceof Error ? exerciseError.message : String(exerciseError);
                console.error(`[setup-exercise-details] ✗ Exception for "${ex.name}": ${msg}`);
                result.failed++;
                result.failedIds.push(ex.id);
            }
        }

        console.log(`[setup-exercise-details] Done. Processed: ${result.processed}, Failed: ${result.failed}, Skipped: ${result.skipped}`);
        return Response.json({ success: true, ...result });

    } catch (globalError) {
        const msg = globalError instanceof Error ? globalError.message : String(globalError);
        console.error("[setup-exercise-details] Fatal error:", msg);
        return Response.json({ success: false, error: msg }, { status: 500 });
    }
}
