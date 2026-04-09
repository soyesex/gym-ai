/**
 * @file app/profile/loading.tsx
 * Suspense fallback for the /profile page.
 */
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";

export default function ProfileLoading() {
    return <ProfileSkeleton />;
}
