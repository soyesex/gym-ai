/**
 * @file app/onboarding/page.tsx
 * Onboarding entry point — Server Component.
 *
 * Fetches the auth user server-side so we can greet them by name
 * on the first step of the wizard, instead of showing "Agent".
 */
import { getAuthUser } from "@/lib/supabase/queries";
import OnboardingWizard from "./OnboardingWizard";

export const metadata = {
    title: "GYM-AI · Initialize Protocol",
    description: "Set up your personal training protocol",
};

export default async function OnboardingPage() {
    const authUser = await getAuthUser();

    // Derive a display-friendly name from the email prefix (e.g. "john.doe@..." → "john.doe")
    const emailPrefix = authUser?.email?.split("@")[0] ?? null;

    return <OnboardingWizard authName={emailPrefix} />;
}
