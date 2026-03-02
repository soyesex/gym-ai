"use server";

/**
 * @file app/workouts/actions.ts
 * Server Actions for the workout lifecycle.
 *
 * Flow:
 *   createWorkout()  → inserts a new active workout, returns its id
 *   addSet()         → appends a workout_sets row
 *   updateSet()      → edits reps / weight / rpe on an existing set
 *   deleteSet()      → removes a set row
 *   finishWorkout()  → marks the workout completed and records duration
 *
 * NOTE on revalidatePath:
 *   addSet / updateSet / deleteSet do NOT call revalidatePath because they are
 *   invoked from WorkoutSession (a Client Component) that manages its own local
 *   state optimistically. Re-triggering a full server re-render mid-session
 *   would wipe the client's useState and make optimistic updates impossible.
 *   Only finishWorkout needs revalidation (to update the workouts list & dashboard).
 */
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Standard return shape for every action */
type ActionResult<T = void> =
    | { success: true; data: T }
    | { success: false; message: string };

async function getAuthUserId(): Promise<string | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
}

// ── Actions ────────────────────────────────────────────────────────────────────

/**
 * Creates a new workout session with status = 'active'.
 * We explicitly set started_at so the elapsed timer is accurate even if
 * the DB column default has any clock skew vs the server timestamp.
 * Returns the new workout id so the UI can redirect to /workouts/[id].
 */
export async function createWorkout(
    name: string
): Promise<ActionResult<{ id: string }>> {
    const supabase = await createClient();
    const userId = await getAuthUserId();
    if (!userId) return { success: false, message: "Not authenticated." };

    const { data, error } = await supabase
        .from("workouts")
        .insert({
            user_id: userId,
            name: name.trim(),
            status: "active",
            // BUG-05 FIX: set explicitly so the elapsed timer is always accurate
            started_at: new Date().toISOString(),
        })
        .select("id")
        .single();

    if (error || !data) {
        console.error("[createWorkout]", error?.message);
        return { success: false, message: error?.message ?? "Unknown error." };
    }

    revalidatePath("/workouts");
    revalidatePath("/log");
    return { success: true, data: { id: data.id } };
}

/** Payload for a new or updated set */
export interface SetPayload {
    weight_kg: number;
    reps: number;
    set_order: number;
    rpe?: number | null;
    is_warmup?: boolean;
}

/**
 * Appends a new set row to a workout.
 * `set_order` must be provided by the caller (max + 1 within the exercise group).
 *
 * Does NOT call revalidatePath — WorkoutSession manages state client-side
 * to allow optimistic inserts without triggering a full server re-render.
 */
export async function addSet(
    workoutId: string,
    exerciseId: string,
    payload: SetPayload
): Promise<ActionResult<{ id: string }>> {
    const supabase = await createClient();
    const userId = await getAuthUserId();
    if (!userId) return { success: false, message: "Not authenticated." };

    const { data, error } = await supabase
        .from("workout_sets")
        .insert({ workout_id: workoutId, exercise_id: exerciseId, ...payload })
        .select("id")
        .single();

    if (error || !data) {
        console.error("[addSet]", error?.message);
        return { success: false, message: error?.message ?? "Unknown error." };
    }

    // BUG-02 FIX: no revalidatePath here — would wipe WorkoutSession client state
    return { success: true, data: { id: data.id } };
}

/**
 * Updates mutable fields on an existing set (weight, reps, rpe).
 * Called on blur from the inline set-row inputs.
 *
 * Does NOT call revalidatePath (same reason as addSet).
 * BUG-04 FIX: added .eq("workout_id", workoutId) as a defense-in-depth guard.
 */
export async function updateSet(
    setId: string,
    workoutId: string,
    fields: Partial<Pick<SetPayload, "weight_kg" | "reps" | "rpe">>
): Promise<ActionResult> {
    const supabase = await createClient();
    const userId = await getAuthUserId();
    if (!userId) return { success: false, message: "Not authenticated." };

    const { error } = await supabase
        .from("workout_sets")
        .update(fields)
        .eq("id", setId)
        .eq("workout_id", workoutId); // BUG-04 FIX: double-filter for safety

    if (error) {
        console.error("[updateSet]", error.message);
        return { success: false, message: error.message };
    }

    // BUG-02 FIX: no revalidatePath here
    return { success: true, data: undefined };
}

/**
 * Deletes a set by id.
 *
 * Does NOT call revalidatePath (same reason as addSet).
 * BUG-04 FIX: added .eq("workout_id", workoutId) as a defense-in-depth guard.
 */
export async function deleteSet(
    setId: string,
    workoutId: string
): Promise<ActionResult> {
    const supabase = await createClient();
    const userId = await getAuthUserId();
    if (!userId) return { success: false, message: "Not authenticated." };

    const { error } = await supabase
        .from("workout_sets")
        .delete()
        .eq("id", setId)
        .eq("workout_id", workoutId); // BUG-04 FIX: double-filter for safety

    if (error) {
        console.error("[deleteSet]", error.message);
        return { success: false, message: error.message };
    }

    // BUG-02 FIX: no revalidatePath here
    return { success: true, data: undefined };
}

/**
 * Marks a workout as completed.
 * Records the wall-clock duration and an optional subjective difficulty rating.
 * This IS the right place for revalidatePath — we want the list and dashboard
 * to reflect the completed session immediately.
 */
export async function finishWorkout(
    workoutId: string,
    durationSeconds: number,
    difficulty?: number
): Promise<ActionResult> {
    const supabase = await createClient();
    const userId = await getAuthUserId();
    if (!userId) return { success: false, message: "Not authenticated." };

    const { error } = await supabase
        .from("workouts")
        .update({
            status: "completed",
            ended_at: new Date().toISOString(),
            duration_seconds: durationSeconds,
            ...(difficulty != null && { subjective_difficulty: difficulty }),
        })
        .eq("id", workoutId);

    if (error) {
        console.error("[finishWorkout]", error.message);
        return { success: false, message: error.message };
    }

    // Invalidate both the session page and the workouts list
    revalidatePath(`/workouts/${workoutId}`);
    revalidatePath("/workouts");
    revalidatePath("/log");     // refresh the Training Log page
    revalidatePath("/");        // refresh dashboard weekly stats + level
    revalidatePath("/profile"); // refresh profile page with updated XP/level
    return { success: true, data: undefined };
}

// ── Recommended Module → Live Workout ──────────────────────────────────────────

/**
 * Shape of a single exercise within a recommended module.
 * Mirrors `RecommendedExercise` from `lib/ai/types.ts` — duplicated here
 * because Server Actions can't import from arbitrary module files without
 * risking serialization issues with the "use server" boundary.
 */
interface ModuleExercise {
    /** UUID pointing to the `exercises` table */
    id: string;
    /** Display name — not stored, just for logging */
    name: string;
    /** AI-prescribed number of working sets */
    sets: number;
    /** AI-prescribed rep range, e.g. "8-12" */
    reps: string;
    /** AI-prescribed rest between sets in seconds */
    restSeconds: number;
}

/**
 * Shape of the module object received from the client.
 * We only declare the fields we actually use for the INSERT.
 */
interface StartModulePayload {
    /** AI-generated title (becomes the workout name) */
    title: string;
    /** Exercises with their prescription */
    exercises: ModuleExercise[];
}

/**
 * Converts an AI-recommended module into a real workout session.
 *
 * Flow:
 *   1. INSERT a new `workouts` row (status = 'active')
 *   2. Bulk INSERT `workout_sets` for every set of every exercise
 *   3. Return the new workout id → client navigates to `/workouts/[id]`
 *
 * The `reps` string from the AI (e.g. "8-12") is parsed to a single number
 * by averaging the range bounds, which gives a sensible starting target.
 *
 * @param module - The recommended module from the RAG pipeline cache
 * @returns ActionResult with the new workout id
 */
export async function startRecommendedWorkout(
    module: StartModulePayload
): Promise<ActionResult<{ id: string }>> {
    const supabase = await createClient();
    const userId = await getAuthUserId();
    if (!userId) return { success: false, message: "Not authenticated." };

    // ── Step 1: Create the workout ────────────────────────────────────────
    const { data: workout, error: workoutError } = await supabase
        .from("workouts")
        .insert({
            user_id: userId,
            name: module.title.trim(),
            status: "active",
            started_at: new Date().toISOString(),
        })
        .select("id")
        .single();

    if (workoutError || !workout) {
        console.error("[startRecommendedWorkout] Workout insert failed:", workoutError?.message);
        return { success: false, message: workoutError?.message ?? "Failed to create workout." };
    }

    const workoutId = workout.id;

    // ── Step 2: Build bulk-insert array for workout_sets ──────────────────
    //
    // For each exercise we create N rows (one per set).
    // `set_order` is a global counter across all exercises so that the
    // WorkoutSession component can render them in the correct order.
    //
    // Example:  Exercise A (3 sets) + Exercise B (4 sets)
    //           → set_order 1,2,3 for A  |  4,5,6,7 for B

    let globalSetOrder = 1;

    const setRows = module.exercises.flatMap((exercise) => {
        const repCount = parseRepRange(exercise.reps);
        const rows = [];

        for (let s = 0; s < exercise.sets; s++) {
            rows.push({
                workout_id: workoutId,
                exercise_id: exercise.id,
                set_order: globalSetOrder++,
                reps: repCount,
                rest_seconds: exercise.restSeconds,
                weight_kg: 0,     // User fills in their own weight during the session
                is_warmup: false,
            });
        }

        return rows;
    });

    // ── Step 3: Bulk INSERT sets ──────────────────────────────────────────
    if (setRows.length > 0) {
        const { error: setsError } = await supabase
            .from("workout_sets")
            .insert(setRows);

        if (setsError) {
            console.error("[startRecommendedWorkout] Sets insert failed:", setsError.message);
            // The workout was already created — we don't want to orphan it,
            // but we should let the user know something went wrong.
            return { success: false, message: setsError.message };
        }
    }

    console.log(
        `[startRecommendedWorkout] ✓ Created workout ${workoutId} with ${setRows.length} sets ` +
        `from ${module.exercises.length} exercises.`
    );

    revalidatePath("/workouts");
    revalidatePath("/log");
    return { success: true, data: { id: workoutId } };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Parses the AI-generated rep range string into a single integer.
 *
 * Examples:
 *   "8-12"  → 10  (average of range bounds)
 *   "15"    → 15  (single number)
 *   "AMRAP" → 10  (sensible default)
 *
 * @param reps - The string from `RecommendedExercise.reps`
 * @returns A numeric rep count suitable for `workout_sets.reps`
 */
function parseRepRange(reps: string): number {
    const DEFAULT_REPS = 10;

    // Try to extract one or two numbers from the string
    const numbers = reps.match(/\d+/g);
    if (!numbers || numbers.length === 0) return DEFAULT_REPS;

    if (numbers.length === 1) return parseInt(numbers[0], 10);

    // For ranges like "8-12", average the bounds and round
    const low = parseInt(numbers[0], 10);
    const high = parseInt(numbers[1], 10);
    return Math.round((low + high) / 2);
}
