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
    let authUser, profile;
    try {
        [authUser, profile] = await Promise.all([
            getAuthUser(),
            getProfile(),
        ]);
    } catch (err) {
        console.error("[ProfilePage] Data fetch failed:", err);
        throw new Error("Failed to load profile data");
    }

    return (
        <ProfileClient
            authEmail={authUser?.email ?? null}
            profile={profile}
        />
    );
}
