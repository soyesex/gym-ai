/**
 * @file lib/auth/password-validation.ts
 * Shared server-side password validation — strength + HIBP breach check.
 *
 * This module is used by:
 *   - /api/auth/signup (sign-up with email/password)
 *   - /auth/reset-password/form/actions.ts (password reset)
 *
 * Security:
 *   - Passwords are NEVER logged or persisted.
 *   - HIBP uses k-anonymity (only first 5 hex chars of SHA-1 are sent).
 *   - The API is rate-limited at the route level, not here.
 */

/** Result of password validation */
export interface PasswordValidationResult {
    valid: boolean;
    /** i18n key for the error message (only set when valid=false) */
    errorKey?: string;
}

/**
 * Full password validation: strength + HIBP breach check.
 * Returns { valid: true } or { valid: false, errorKey: "auth.xxx" }
 */
export async function validatePassword(
    password: string
): Promise<PasswordValidationResult> {
    // Step 1: Strength check
    const strengthResult = validatePasswordStrength(password);
    if (!strengthResult.valid) return strengthResult;

    // Step 2: HIBP breach check
    const hibpResult = await checkHIBP(password);
    if (!hibpResult.valid) return hibpResult;

    return { valid: true };
}

/**
 * Validates password strength:
 *   - Minimum 8 characters
 *   - At least 1 uppercase letter
 *   - At least 1 lowercase letter
 *   - At least 1 digit
 *   - At least 1 special character
 */
export function validatePasswordStrength(
    password: string
): PasswordValidationResult {
    if (password.length < 8) {
        return { valid: false, errorKey: "auth.passwordTooWeak" };
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasDigit || !hasSpecial) {
        return { valid: false, errorKey: "auth.passwordTooWeak" };
    }

    return { valid: true };
}

/**
 * Checks if the password appears in the HIBP Pwned Passwords database.
 * Uses k-anonymity: only the first 5 hex chars of the SHA-1 hash are sent.
 *
 * If the HIBP API is unreachable, we allow the password (fail-open)
 * to avoid blocking users due to a third-party outage.
 */
export async function checkHIBP(
    password: string
): Promise<PasswordValidationResult> {
    try {
        // SHA-1 hash the password
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-1", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
            .toUpperCase();

        const prefix = hashHex.substring(0, 5);
        const suffix = hashHex.substring(5);

        // Query HIBP API with k-anonymity
        const response = await fetch(
            `https://api.pwnedpasswords.com/range/${prefix}`,
            {
                headers: {
                    "User-Agent": "GYM-AI-PasswordCheck",
                },
                // 5-second timeout to avoid blocking the user
                signal: AbortSignal.timeout(5000),
            }
        );

        if (!response.ok) {
            // HIBP API error — fail-open (allow the password)
            return { valid: true };
        }

        const text = await response.text();

        // Each line is "SUFFIX:count" — check if our suffix appears
        const lines = text.split("\n");
        const breached = lines.some((line) => {
            const [hashSuffix] = line.split(":");
            return hashSuffix.trim() === suffix;
        });

        if (breached) {
            return { valid: false, errorKey: "auth.passwordBreached" };
        }

        return { valid: true };
    } catch (err) {
        // Network error, timeout, etc. — fail-open but log for awareness
        console.error("[checkHIBP] HIBP API unreachable, allowing password (fail-open):", err);
        return { valid: true };
    }
}
