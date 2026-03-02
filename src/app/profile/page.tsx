/**
 * @file app/profile/page.tsx
 * Profile page — Server Component.
 *
 * Fetches auth user + profile in parallel, then renders ProfileClient.
 * If the user is somehow unauthenticated, middleware will redirect before
 * this component runs. If the profile is missing, we pass null safely.
 */
import { getAuthUser, getProfile } from "@/lib/supabase/queries";
import ProfileClient from "./ProfileClient";

export const metadata = {
    title: "GYM-AI · Profile",
    description: "View and edit your training profile",
};

export default async function ProfilePage() {
    const [authUser, profile] = await Promise.all([
        getAuthUser(),
        getProfile(),
    ]);

    return (
        <ProfileClient
            authEmail={authUser?.email ?? null}
            profile={profile}
        />
    );
}
