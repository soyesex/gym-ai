"use server";

/**
 * @file app/auth/reset-password/form/actions.ts
 * Server Action for resetting the user's password.
 *
 * Reads the user_id from the "reset-uid" httpOnly cookie (set by route.ts)
 * and uses the admin client to update the password directly via
 * admin.auth.admin.updateUserById(). No client-side session required.
 *
 * Security:
 *   - The "reset-uid" cookie is httpOnly + short-lived (10 min).
 *   - Passwords are NEVER logged.
 *   - The cookie is deleted after a successful reset.
 */
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { validatePassword } from "@/lib/auth/password-validation";

interface ResetResult {
    success: boolean;
    errorKey?: string; // i18n key for the error message
}

export async function resetPassword(password: string): Promise<ResetResult> {
    const cookieStore = await cookies();
    const userId = cookieStore.get("reset-uid")?.value;

    if (!userId) {
        return { success: false, errorKey: "auth.resetLinkExpired" };
    }

    // Server-side password validation: strength + HIBP breach check
    const validation = await validatePassword(password);
    if (!validation.valid) {
        return { success: false, errorKey: validation.errorKey };
    }

    try {
        const admin = createAdminClient();

        const { error } = await admin.auth.admin.updateUserById(userId, {
            password,
        });

        if (error) {
            return { success: false, errorKey: "auth.passwordResetError" };
        }

        // Clear the reset cookie after successful update
        cookieStore.delete("reset-uid");

        return { success: true };
    } catch {
        return { success: false, errorKey: "auth.passwordResetError" };
    }
}
