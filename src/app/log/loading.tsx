/**
 * @file app/log/loading.tsx
 * Suspense fallback for the /log Training Log page.
 */
import { TrainingLogSkeleton } from "@/components/skeletons/TrainingLogSkeleton";

export default function LogLoading() {
    return <TrainingLogSkeleton />;
}
