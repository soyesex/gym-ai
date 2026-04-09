import { cookies } from "next/headers";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";

/**
 * Dashboard layout — manages the Suspense boundary for the dashboard page.
 *
 * The `gym_ai_first_session` cookie is read server-side to distinguish
 * the initial auth→dashboard transition from normal navigations.
 * In both cases we now render the DashboardSkeleton (the Lottie FullScreenLoader
 * has been removed for a faster, more consistent experience).
 *
 * The cookie value is still consumed here for future use (e.g. "welcome" messages).
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    // Read cookie server-side — no hydration mismatch possible
    const cookieStore = await cookies();
    const _isFirstSession = cookieStore.get("gym_ai_first_session")?.value === "1";

    return (
        <Suspense fallback={<DashboardSkeleton />}>
            {children}
        </Suspense>
    );
}
