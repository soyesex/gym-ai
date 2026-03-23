/**
 * @file lib/api-error-handler.ts
 * Centralized fetch wrapper with error handling and i18n error keys.
 *
 * Usage:
 *   const { data, error, errorKey } = await apiFetch<MyType>("/api/endpoint");
 *   if (error) {
 *     // errorKey is an i18n key like "error.serverError"
 *     // Use t(errorKey) in the component to show the translated message
 *   }
 *
 * Features:
 *   - 10s timeout via AbortSignal.timeout
 *   - HTTP status → i18n error key mapping
 *   - 401 → redirect to /login (session expired)
 *   - Network errors → "error.networkError"
 *   - Timeout → "error.timeout"
 */

/** Result type returned by apiFetch */
export interface ApiFetchResult<T> {
    data: T | null;
    error: string | null;
    errorKey: string | null;
}

/** Options for apiFetch — extends standard RequestInit */
interface ApiFetchOptions extends Omit<RequestInit, "signal"> {
    /** Timeout in milliseconds (default: 10000) */
    timeoutMs?: number;
}

/**
 * Maps HTTP status codes to i18n error keys.
 */
function getErrorKeyForStatus(status: number): string {
    if (status === 401) return "error.sessionExpired";
    if (status === 403) return "error.forbidden";
    if (status === 404) return "error.notFound";
    if (status === 429) return "error.tooManyRequests";
    if (status >= 500) return "error.serverError";
    return "error.generic";
}

/**
 * Wrapped fetch with automatic error handling.
 *
 * @example
 * ```ts
 * const { data, errorKey } = await apiFetch<Workout[]>("/api/workouts");
 * if (errorKey) {
 *   showToast(t(errorKey));
 *   return;
 * }
 * // use data safely
 * ```
 */
export async function apiFetch<T = unknown>(
    url: string,
    options: ApiFetchOptions = {}
): Promise<ApiFetchResult<T>> {
    const { timeoutMs = 10_000, ...fetchOptions } = options;

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: AbortSignal.timeout(timeoutMs),
        });

        // ── 401: Session expired → redirect to login ─────────────────
        if (response.status === 401) {
            if (typeof window !== "undefined") {
                window.location.href = "/login";
            }
            return {
                data: null,
                error: "Session expired",
                errorKey: "error.sessionExpired",
            };
        }

        // ── Non-OK response → map to i18n key ───────────────────────
        if (!response.ok) {
            const errorKey = getErrorKeyForStatus(response.status);
            console.error(`[apiFetch] HTTP ${response.status} for ${url}`);
            return {
                data: null,
                error: `HTTP ${response.status}`,
                errorKey,
            };
        }

        // ── Success ──────────────────────────────────────────────────
        const data = (await response.json()) as T;
        return { data, error: null, errorKey: null };
    } catch (err) {
        // ── Timeout (AbortError from AbortSignal.timeout) ────────────
        if (err instanceof DOMException && err.name === "TimeoutError") {
            console.error(`[apiFetch] Timeout after ${timeoutMs}ms for ${url}`);
            return {
                data: null,
                error: "Request timed out",
                errorKey: "error.timeout",
            };
        }

        // ── Network error (Failed to fetch, DNS, etc.) ───────────────
        if (err instanceof TypeError) {
            console.error(`[apiFetch] Network error for ${url}:`, err.message);
            return {
                data: null,
                error: err.message,
                errorKey: "error.networkError",
            };
        }

        // ── Unknown error ────────────────────────────────────────────
        console.error(`[apiFetch] Unexpected error for ${url}:`, err);
        return {
            data: null,
            error: String(err),
            errorKey: "error.generic",
        };
    }
}

// ── AI-specific helpers ─────────────────────────────────────────────────────

/**
 * Maps errors from AI/Gemini endpoints to specific i18n keys.
 * Use this in components that call AI endpoints to get more specific error messages.
 */
export function getAiErrorKey(status: number): string {
    if (status === 429) return "error.aiUnavailable";
    if (status === 408 || status === 504) return "error.aiTimeout";
    return "error.aiGeneric";
}
