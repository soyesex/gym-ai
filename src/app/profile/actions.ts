"use server";

/**
 * @file app/profile/actions.ts
 * Server Actions for the profile edit page.
 *
 * Why partial payload:
 *   Each UI section saves independently (Goal, Body Metrics, Schedule…).
 *   We use Partial<> so the caller only sends the fields that changed,
 *   and we spread them into the upsert — untouched fields are not overwritten.
 *
 * Why "use server" + UPSERT:
 *   Runs with the full server auth context (cookies never leave the server).
 *   UPSERT is safe even if the row was somehow deleted and recreated.
 */
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Tables } from "@/lib/supabase/database.types";

// Fields the user is allowed to edit from the profile page
type EditableFields = Partial<
    Pick<
        Tables<"profiles">,
        | "full_name"
        | "username"
        | "goal"
        | "level"
        | "equipment"
        | "weight_kg"
        | "height_cm"
        | "days_per_week"
        | "minutes_per_session"
    >
>;

/**
 * Persists an arbitrary subset of profile fields.
 * Called independently by each editable section on the profile page.
 */
export async function updateProfile(
    fields: EditableFields
): Promise<{ success: boolean; message: string }> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: "Not authenticated." };
    }

    const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, ...fields, updated_at: new Date().toISOString() });

    if (error) {
        console.error("[updateProfile] Supabase error:", error.message);
        return { success: false, message: error.message };
    }

    // Tell Next.js to invalidate the cached /profile page data
    revalidatePath("/profile");

    return { success: true, message: "Saved." };
}

/**
 * Signs the user out server-side and invalidates the session cookie.
 * The client then redirects to /login.
 */
export async function signOut(): Promise<{ success: boolean }> {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/");
    return { success: true };
}
