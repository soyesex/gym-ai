"use server";

/**
 * @file app/(auth)/forgot-password/actions.ts
 * Server Actions for the forgot-password page.
 *
 * checkEmailProvider:
 *   Uses the admin Supabase client to look up the user by email
 *   and check if they signed up exclusively with Google OAuth.
 *   If so, the client shows a specific message instead of sending a reset email.
 *
 * sendResetEmail:
 *   Sends a password reset email via Supabase Auth.
 *   Always returns a success-like response to avoid revealing whether
 *   the email exists (except for the Google-only case, which is intentional UX).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Checks if an email belongs to a Google-only user (no password identity).
 *
 * Uses `app_metadata.providers` (always reliable) instead of `identities[]`.
 * - providers includes "email" → user has a password → can reset
 * - providers is ["google"] only → Google-only account → show redirect message
 * - providers has both ["email", "google"] → linked account → can reset
 *
 * Returns "google" if the user only has a Google identity,
 * "email" if they have an email/password identity (possibly alongside Google),
 * or null if the user doesn't exist.
 */
export async function checkEmailProvider(
    email: string
): Promise<"google" | "email" | null> {
    try {
        const admin = createAdminClient();

        // Use admin API to list users — filter manually by email
        // GoTrue paginates at 50/page by default; we iterate to find the user
        let page = 1;
        const perPage = 50;

        while (true) {
            const {
                data: { users },
                error,
            } = await admin.auth.admin.listUsers({ page, perPage });

            if (error || !users || users.length === 0) break;

            const user = users.find(
                (u) => u.email?.toLowerCase() === email.toLowerCase()
            );

            if (user) {
                // app_metadata.providers is the reliable source of truth
                // It's an array like ["email"], ["google"], or ["email","google"]
                const providers: string[] =
                    (user.app_metadata?.providers as string[]) ?? [];
                const hasEmailProvider = providers.includes("email");
                return hasEmailProvider ? "email" : "google";
            }

            // If we got fewer users than perPage, we've reached the last page
            if (users.length < perPage) break;
            page++;
        }

        return null; // User not found
    } catch {
        // If admin lookup fails, return null (will fall through to generic message)
        return null;
    }
}

/**
 * Sends a password reset email.
 * Returns { sent: true } always — we don't reveal if the email exists.
 */
export async function sendResetEmail(
    email: string
): Promise<{ sent: boolean }> {
    try {
        const supabase = await createClient();
        const siteUrl =
            process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

        await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${siteUrl}/auth/reset-password`,
        });

        return { sent: true };
    } catch {
        // Silently succeed even on error — never reveal if email exists
        return { sent: true };
    }
}
