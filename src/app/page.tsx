/**
 * @file app/page.tsx
 * Home dashboard — Server Component.
 *
 * First-time detection:
 *   If the user's profile has no `goal` set, it means onboarding was never completed.
 *   In that case, we redirect to /onboarding BEFORE rendering anything.
 *
 * Data flow (returning users):
 *   Parallel fetch → authUser + profile + weeklyStats + activeWorkout + AI modules
 *   → Props passed to HomeClient (Client Component)
 *
 * The AI recommendation call (`getRecommendedModules`) runs alongside the other
 * fetches so it doesn't add to the critical path. If the AI call fails for any
 * reason, the Home page still renders with an empty modules array.
 *
 * Locale:
 *   The user's preferred language is read from the `gym-ai-locale` cookie
 *   (set by the client-side I18nProvider). This is passed to the RAG pipeline
 *   so that module titles are generated in the correct language.
 */
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAuthUser, getProfile, getWeeklyWorkoutStats, getWorkouts, isProfileComplete } from "@/lib/supabase/queries";
import { getRecommendedModules } from "@/lib/ai/recommendations";
import HomeClient from "@/components/home/HomeClient";
import type { Locale } from "@/i18n";

export default async function HomePage() {
  // Read locale from cookie (set by I18nProvider on the client)
  const cookieStore = await cookies();
  const locale = (cookieStore.get("gym-ai-locale")?.value ?? "en") as Locale;

  // Fetch auth user + profile first to determine routing
  const [authUser, profile] = await Promise.all([
    getAuthUser(),
    getProfile(),
  ]);

  // Guard: if somehow not authenticated, send to login
  if (!authUser) {
    redirect("/login");
  }

  // Onboarding guard: if critical profile fields are missing, redirect
  // to the onboarding wizard BEFORE triggering any expensive data fetches.
  if (!isProfileComplete(profile)) {
    redirect("/onboarding");
  }

  // Returning user — fetch remaining data + AI recommendations in parallel.
  // The AI call is wrapped in a catch so a Gemini failure never breaks the page.
  const [weeklyStats, allWorkouts, recommendedModules] = await Promise.all([
    getWeeklyWorkoutStats(),
    getWorkouts(),
    getRecommendedModules(authUser.id, locale).catch((err) => {
      console.error("[HomePage] AI recommendations failed:", err);
      return [];
    }),
  ]);

  // Find any currently active session so the dashboard can show a "Resume" banner
  const activeWorkout = allWorkouts.find((w) => w.status === "active") ?? null;

  return (
    <HomeClient
      authEmail={authUser.email ?? null}
      profile={profile!}
      weeklyStats={weeklyStats}
      activeWorkout={activeWorkout}
      recommendedModules={recommendedModules}
    />
  );
}
