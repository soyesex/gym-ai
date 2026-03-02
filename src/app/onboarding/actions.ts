"use server";

/**
 * @file app/onboarding/actions.ts
 * Server Actions for the onboarding wizard.
 *
 * Why Server Actions instead of a Route Handler?
 * - They run on the server with the full auth context already resolved.
 * - No need to manually pass the session token — Supabase SSR reads it from cookies.
 * - The client calls them like regular async functions (no fetch boilerplate).
 *
 * Data flow:
 *   OnboardingWizard (client) collects all form data across steps
 *   → calls saveProfile() with the complete payload on the final step
 *   → Server Action validates, writes to Supabase, returns success/error
 *   → Client redirects to "/"
 */
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

// The fields we collect during onboarding — a subset of the full profiles schema
type OnboardingPayload = Pick<
    Tables<"profiles">,
    | "full_name"
    | "goal"
    | "level"
    | "equipment"
    | "weight_kg"
    | "height_cm"
    | "days_per_week"
    | "minutes_per_session"
>;

/**
 * Persists the onboarding data to the `profiles` table.
 * Uses UPSERT so it works even if the trigger created the row already.
 */
export async function saveProfile(
    payload: OnboardingPayload
): Promise<{ success: boolean; message: string }> {
    const supabase = await createClient();

    // Validate the JWT and get the current user server-side
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: "Not authenticated." };
    }

    // Upsert: insert if missing, update if exists (handles both cases cleanly)
    const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, ...payload, updated_at: new Date().toISOString() });

    if (error) {
        console.error("[saveProfile] Supabase error:", error.message);
        return { success: false, message: error.message };
    }

    return { success: true, message: "Profile saved." };
}
