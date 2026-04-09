/**
 * @file app/session/[id]/loading.tsx
 * Suspense fallback for the /session/[id] workout page.
 */
import { SessionSkeleton } from "@/components/skeletons/SessionSkeleton";

export default function SessionLoading() {
    return <SessionSkeleton />;
}
