/**
 * @file app/workouts/loading.tsx
 * Suspense fallback for the /workouts Exercise Library page.
 */
import { WorkoutsLibrarySkeleton } from "@/components/skeletons/WorkoutsLibrarySkeleton";

export default function WorkoutsLoading() {
    return <WorkoutsLibrarySkeleton />;
}
