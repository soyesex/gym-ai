/**
 * @file lib/ai/types.ts
 * Shared TypeScript interfaces for the AI recommendation pipeline.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ Data Flow Overview                                                 │
 * │                                                                    │
 * │  profiles (Supabase)                                               │
 * │       │                                                            │
 * │       ▼                                                            │
 * │  UserProfileContext   ──→  Gemini prompt + embedding               │
 * │                                    │                               │
 * │                                    ▼                               │
 * │  exercises.embedding (pgvector)  ◄── cosine similarity search      │
 * │       │                                                            │
 * │       ▼                                                            │
 * │  RecommendedExercise[]  ──→  grouped into RecommendedModule[]      │
 * │                                    │                               │
 * │                                    ▼                               │
 * │                              HomeClient renders                    │
 * │                              RecommendedModuleCard                 │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * These types are consumed by:
 * - `lib/ai/recommendations.ts` — the service that produces modules
 * - `components/home/HomeClient.tsx` — the UI that renders them
 * - `components/home/RecommendedModuleCard.tsx` — individual card component
 */

import type { Enums } from "@/lib/supabase/database.types";

// ---------------------------------------------------------------------------
// UserProfileContext
// ---------------------------------------------------------------------------

/**
 * Subset of the `profiles` row that is relevant for building the AI prompt.
 *
 * We intentionally pick only the fields that influence exercise selection
 * so the prompt stays focused and token-efficient.
 *
 * @example
 * ```ts
 * const ctx: UserProfileContext = {
 *   goal: "build_muscle",
 *   level: "intermediate",
 *   equipment: "gym_full",
 *   injuries: ["lower_back"],
 *   daysPerWeek: 4,
 *   minutesPerSession: 60,
 * };
 * ```
 */
export interface UserProfileContext {
    /** Primary fitness goal — drives exercise prioritization */
    goal: Enums<"fitness_goal">;

    /** Experience level — affects rep ranges, complexity, and load suggestions */
    level: Enums<"experience_level">;

    /** Available equipment — filters exercises the user can actually perform */
    equipment: Enums<"equipment_access">;

    /** Known injuries — exercises targeting these areas will be avoided or flagged */
    injuries: string[];

    /** How many days per week the user trains — controls module frequency */
    daysPerWeek: number;

    /** Target session length in minutes — caps the total duration of each module */
    minutesPerSession: number;
}

// ---------------------------------------------------------------------------
// RecommendedExercise
// ---------------------------------------------------------------------------

/**
 * A single exercise within a recommended training module.
 *
 * Maps closely to the `exercises` table row but adds prescription fields
 * (sets, reps, restSeconds) that the AI generates based on the user's profile.
 */
export interface RecommendedExercise {
    /** UUID from the `exercises` table — enables linking to exercise details */
    id: string;

    /** Exercise display name (e.g. "Barbell Bench Press") */
    name: string;

    /** Primary muscle group targeted */
    primaryMuscle: Enums<"muscle_group">;

    /** AI-prescribed number of working sets */
    sets: number;

    /** AI-prescribed rep range (e.g. "8-12") */
    reps: string;

    /** AI-prescribed rest between sets in seconds */
    restSeconds: number;
}

// ---------------------------------------------------------------------------
// RecommendedModule
// ---------------------------------------------------------------------------

/**
 * A complete training module (routine) recommended by the AI pipeline.
 *
 * This interface is designed to be a **superset** of `RecommendedRoutine`
 * from `RecommendedModuleCard.tsx`, adding the `exercises` array that the
 * card component doesn't need but the workout-start flow will consume.
 *
 * Shape alignment with the current mock data:
 *
 * | RecommendedRoutine (card) | RecommendedModule (AI)   |
 * |---------------------------|--------------------------|
 * | id                        | id                       |
 * | name                      | name                     |
 * | matchPercent              | matchPercent             |
 * | difficulty                | difficulty               |
 * | exerciseCount             | exerciseCount            |
 * | durationMin               | durationMin              |
 * | gradient                  | gradient                 |
 * | —                         | exercises (new!)         |
 *
 * The `gradient` is auto-generated based on difficulty tier so each card
 * gets a visually distinct background.
 */
export interface RecommendedModule {
    /** Unique identifier for React keys and future caching */
    id: string;

    /** AI-generated routine name (e.g. "UPPER BODY FUNDAMENTALS") */
    name: string;

    /** AI-calculated match percentage (0-100) based on cosine similarity + profile fit */
    matchPercent: number;

    /** Difficulty tier — derived from the user's experience level and exercise mix */
    difficulty: "Beginner" | "Intermediate" | "Advanced";

    /** Total number of exercises in this module */
    exerciseCount: number;

    /** Estimated duration in minutes — respects the user's `minutesPerSession` */
    durationMin: number;

    /** CSS gradient string for the card background */
    gradient: string;

    /**
     * Ordered list of exercises within this module.
     * The card component doesn't render these, but they're needed
     * when the user taps "START" and we create a real workout session.
     */
    exercises: RecommendedExercise[];
}

// ---------------------------------------------------------------------------
// EmbeddingResult
// ---------------------------------------------------------------------------

/**
 * Summary returned by `generateExerciseEmbeddings()` after processing
 * exercises that lacked vector embeddings.
 */
export interface EmbeddingResult {
    /** How many exercises were successfully embedded */
    processed: number;

    /** How many exercises were skipped (already had an embedding) */
    skipped: number;

    /** How many exercises failed to embed (API errors, etc.) */
    failed: number;

    /** IDs of exercises that failed — useful for retry logic */
    failedIds: string[];
}
