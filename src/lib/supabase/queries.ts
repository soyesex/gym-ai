/**
 * @file lib/supabase/queries.ts
 * Centralized data-fetching functions for the app.
 *
 * These are called from Server Components or Route Handlers — they use the
 * server-side Supabase client so the session/RLS context is always correct.
 *
 * Design principle: each function is small, typed, and does one thing.
 * Components import what they need; no monolithic data layer.
 */
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import type { Tables } from "@/lib/supabase/database.types";

// ── Auth ──────────────────────────────────────────────────────────────────────

/**
 * Returns the currently authenticated user object from Supabase Auth.
 * Validates the JWT server-side — safer than reading from cookies directly.
 * Returns null if the user is not authenticated.
 */
export async function getAuthUser(): Promise<User | null> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user;
}

// ── Exercises ─────────────────────────────────────────────────────────────────

/** Fetches all exercises from the public library (no auth required). */
export async function getExercises(): Promise<Tables<"exercises">[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("primary_muscle", { ascending: true })
        .order("mechanic", { ascending: false }); // compound first

    if (error) {
        // Log on server, return empty array to avoid crashing the UI
        console.error("[getExercises] Supabase error:", error.message);
        return [];
    }

    return data ?? [];
}

// ── Profiles ──────────────────────────────────────────────────────────────────

/** Fetches the current user's profile. Returns null if not found or unauthenticated. */
export async function getProfile(): Promise<Tables<"profiles"> | null> {
    const supabase = await createClient();

    // First, get the authenticated user (validates JWT server-side)
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        // maybeSingle() returns null (not an error) when zero rows match.
        // This is safer than .single() which errors on empty results.
        .maybeSingle();

    if (error) {
        console.error("[getProfile] Supabase error:", error.message);
        return null;
    }

    return data;
}

/**
 * Checks whether a profile has been completed through onboarding.
 *
 * The Supabase trigger creates a `profiles` row on sign-up with default/null
 * values. This function returns `false` if any strictly required onboarding
 * field is still missing, which means the user should be redirected to
 * `/onboarding` before being allowed into the app.
 *
 * @param profile - The profiles row (or null if it doesn't exist yet)
 * @returns `true` if all critical onboarding fields are present
 */
export function isProfileComplete(profile: Tables<"profiles"> | null): boolean {
    if (!profile) return false;
    return (
        profile.goal != null &&
        profile.level != null &&
        profile.weight_kg != null
    );
}

// ── Workouts ──────────────────────────────────────────────────────────────────

/** A workout_sets row enriched with the exercise name and primary muscle. */
export type SetWithExercise = Tables<"workout_sets"> & {
    exercises: Pick<Tables<"exercises">, "id" | "name" | "primary_muscle">;
};

/** A workout row with all its sets already joined. */
export type WorkoutWithSets = Tables<"workouts"> & { sets: SetWithExercise[] };

/**
 * Fetches workout stats for the current week.
 * Returns count of completed workouts and total duration in seconds.
 */
export async function getWeeklyWorkoutStats(): Promise<{
    completed: number;
    totalDurationSeconds: number;
}> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { completed: 0, totalDurationSeconds: 0 };

    // Calculate the start of the current ISO week (Monday 00:00 UTC)
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - daysFromMonday);
    weekStart.setUTCHours(0, 0, 0, 0);

    const { data, error } = await supabase
        .from("workouts")
        .select("status, duration_seconds")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("started_at", weekStart.toISOString());

    if (error) {
        console.error("[getWeeklyWorkoutStats] Supabase error:", error.message);
        return { completed: 0, totalDurationSeconds: 0 };
    }

    const stats = (data ?? []).reduce(
        (acc, w) => ({
            completed: acc.completed + 1,
            totalDurationSeconds: acc.totalDurationSeconds + (w.duration_seconds ?? 0),
        }),
        { completed: 0, totalDurationSeconds: 0 }
    );

    return stats;
}

/**
 * Fetches all workouts for the current user, newest first.
 * Used by the /workouts list page.
 */
export async function getWorkouts(): Promise<Tables<"workouts">[]> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });

    if (error) {
        console.error("[getWorkouts] Supabase error:", error.message);
        return [];
    }

    return data ?? [];
}

/**
 * Fetches a single workout with all its sets joined to exercise data.
 * Returns null if not found or the workout belongs to another user (RLS).
 */
export async function getWorkoutWithSets(
    workoutId: string
): Promise<WorkoutWithSets | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("workouts")
        .select(`
            *,
            sets:workout_sets (
                *,
                exercises ( id, name, primary_muscle )
            )
        `)
        .eq("id", workoutId)
        // BUG-08 FIX: referencedTable ordering via .order() is not reliably
        // supported for nested relations in all supabase-js versions.
        // We sort the sets client-side below instead.
        .maybeSingle();

    if (error) {
        console.error("[getWorkoutWithSets] Supabase error:", error.message);
        return null;
    }

    if (!data) return null;

    // PostgREST returns the nested relation as `sets`; cast to our typed shape.
    const workout = data as unknown as WorkoutWithSets;

    // Sort sets by set_order so the UI always renders them in the correct sequence.
    workout.sets = [...workout.sets].sort(
        (a, b) => (a.set_order ?? 0) - (b.set_order ?? 0)
    );

    return workout;
}
