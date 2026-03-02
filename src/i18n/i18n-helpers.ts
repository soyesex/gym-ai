/**
 * @file i18n/i18n-helpers.ts
 * Shared helper utilities for dynamic i18n data rendering.
 *
 * These functions handle the locale-aware fallback pattern used throughout
 * the app when displaying exercise names and descriptions from the database.
 *
 * Pattern:
 *   If locale is "es" AND the Spanish field is non-null → use it.
 *   Otherwise → fall back to the English canonical field.
 */

import type { Locale } from "./I18nProvider";

// ── Types ──────────────────────────────────────────────────────────────────────

/**
 * Minimal shape of an exercise object that has optional Spanish translations.
 * Both `Tables<"exercises">` and the `match_exercises` RPC return match this.
 */
interface LocalizedExercise {
    name: string;
    name_es?: string | null;
    description?: string | null;
    description_es?: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Returns the locale-appropriate exercise name.
 *
 * @example
 * ```ts
 * const name = getExerciseName(exercise, "es");
 * // → "Press de Banca con Barra"  (if name_es exists)
 * // → "Barbell Bench Press"       (fallback)
 * ```
 */
export function getExerciseName(exercise: LocalizedExercise, locale: Locale): string {
    if (locale === "es" && exercise.name_es) return exercise.name_es;
    return exercise.name;
}

/**
 * Returns the locale-appropriate exercise description.
 *
 * @example
 * ```ts
 * const desc = getExerciseDescription(exercise, "es");
 * ```
 */
export function getExerciseDescription(
    exercise: LocalizedExercise,
    locale: Locale
): string | null {
    if (locale === "es" && exercise.description_es) return exercise.description_es;
    return exercise.description ?? null;
}
