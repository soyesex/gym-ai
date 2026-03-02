/**
 * @file app/workouts/[id]/page.tsx
 * Server Component shell for an individual workout session.
 *
 * - If the workout is 'active'    → renders WorkoutSession (live tracker)
 * - If the workout is 'completed' → renders a read-only summary
 * - If not found (404 / RLS)      → notFound()
 */
import { notFound, redirect } from "next/navigation";
import { getWorkoutWithSets, getExercises, getProfile, isProfileComplete } from "@/lib/supabase/queries";
import WorkoutSession from "./WorkoutSession";
import WorkoutSummary from "./WorkoutSummary";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function WorkoutPage({ params }: PageProps) {
    const { id } = await params;

    // Onboarding guard — redirect if profile is incomplete
    const profile = await getProfile();
    if (!isProfileComplete(profile)) {
        redirect("/onboarding");
    }

    const [workout, exercises] = await Promise.all([
        getWorkoutWithSets(id),
        getExercises(),
    ]);

    if (!workout) notFound();

    if (workout.status === "active") {
        return <WorkoutSession workout={workout} exercises={exercises} />;
    }

    return <WorkoutSummary workout={workout} />;
}
