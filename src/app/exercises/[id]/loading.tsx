/**
 * @file app/exercises/[id]/loading.tsx
 * Suspense fallback for the exercise detail page.
 *
 * Next.js App Router automatically displays this component while the
 * async Server Component (page.tsx) is fetching data from Supabase.
 * No dynamic import needed — Next.js handles the Suspense boundary.
 */
import ExerciseDetailSkeleton from "./ExerciseDetailSkeleton";

export default function ExerciseDetailLoading() {
    return <ExerciseDetailSkeleton />;
}
