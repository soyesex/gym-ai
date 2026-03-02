/**
 * @file app/workouts/page.tsx
 * Server Component — Exercise Library.
 *
 * After the route restructuring, `/workouts` now serves the Exercise Library
 * (previously this page showed the Training Log, which moved to `/log`).
 *
 * Data flow:
 *   Fetches all exercises via `getExercises()` → passes them to the
 *   `ExerciseLibrary` client component which handles search and filtering.
 */
import { redirect } from "next/navigation";
import { getExercises, getProfile, isProfileComplete } from "@/lib/supabase/queries";
import ExerciseLibrary from "@/components/home/ExerciseLibrary";
import BottomNav from "@/components/home/BottomNav";

export default async function ExerciseLibraryPage() {
    // Onboarding guard — redirect if profile is incomplete
    const profile = await getProfile();
    if (!isProfileComplete(profile)) {
        redirect("/onboarding");
    }

    const exercises = await getExercises();

    return (
        <main
            className="min-h-screen pb-24"
            style={{ background: "#000", maxWidth: "480px", margin: "0 auto" }}
        >
            <ExerciseLibrary exercises={exercises} />
            <BottomNav />
        </main>
    );
}
