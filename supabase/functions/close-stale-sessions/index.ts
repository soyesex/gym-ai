// @ts-nocheck - Suppress Node.js IDE errors for this Deno Edge Function
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req: Request) => {
    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Fetch active sessions older than 4 hours
        // 4 hours = 4 * 60 * 60 * 1000 = 14,400,000 ms
        const fourHoursAgo = new Date(Date.now() - 14400000).toISOString();

        const { data: staleWorkouts, error: fetchError } = await supabase
            .from("workouts")
            .select("id, started_at")
            .eq("status", "active")
            .lt("started_at", fourHoursAgo);

        if (fetchError) {
            throw fetchError;
        }

        if (!staleWorkouts || staleWorkouts.length === 0) {
            return new Response(JSON.stringify({ message: "No stale sessions found." }), {
                headers: { "Content-Type": "application/json" },
                status: 200,
            });
        }

        let updatedCount = 0;

        // 2. Loop through and "finish" each one
        for (const workout of staleWorkouts) {
            // Find the duration based on the started_at and 4 hours maximum (14400s)
            // or we could query the sets to find the last set's timestamp.
            // For simplicity, let's mark it as exactly 4 hours duration, with difficulty 7.
            
            const reqPayload = {
                duration_seconds: 14400,
                subjective_difficulty: 7,
                status: "completed"
            };

            const { error: updateError } = await supabase
                .from("workouts")
                .update(reqPayload)
                .eq("id", workout.id);

            if (updateError) {
                console.error(`Failed to update workout ${workout.id}:`, updateError);
            } else {
                updatedCount++;
            }
        }

        return new Response(JSON.stringify({ message: `Closed ${updatedCount} stale sessions.` }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } catch (err) {
        console.error("Error closing stale sessions:", err);
        return new Response(JSON.stringify({ error: String(err) }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        });
    }
});
