/**
 * @file i18n/index.ts
 * Barrel export for the i18n module.
 *
 * Usage:
 *   import { I18nProvider, useTranslation, type Locale } from "@/i18n";
 */
export { I18nProvider, useTranslation, type Locale } from "./I18nProvider";
export { getExerciseName, getExerciseDescription } from "./i18n-helpers";
