/**
 * @file app/stats/loading.tsx
 * Suspense fallback for the /stats page.
 */
import { StatsSkeleton } from "@/components/skeletons/StatsSkeleton";

export default function StatsLoading() {
    return <StatsSkeleton />;
}
