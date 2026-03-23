/**
 * @file app/auth/callback/route.ts
 * OAuth callback Route Handler — handles the redirect from Google (or any OAuth provider).
 *
 * Flow:
 *   1. User clicks "Continue with Google" → redirected to Google consent screen.
 *   2. Google redirects back to /auth/callback?code=...
 *   3. This handler exchanges the code for a Supabase session.
 *   4. Checks if the user has a completed profile → redirects to /onboarding or /dashboard.
 *
 * Error handling:
 *   - error=access_denied → user cancelled → redirect to /login?error=cancelled
 *   - Any other error → redirect to /login?error=oauth_error
 *   - Missing code → redirect to /login?error=oauth_error
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
    const { searchParams, origin } = request.nextUrl;

    // ── Sanitize: only read expected query params ──────────────────────
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    // ── Handle OAuth errors ───────────────────────────────────────────
    if (error) {
        const loginUrl = new URL("/login", origin);
        if (error === "access_denied") {
            loginUrl.searchParams.set("error", "cancelled");
        } else {
            loginUrl.searchParams.set("error", "oauth_error");
        }
        return NextResponse.redirect(loginUrl);
    }

    if (!code) {
        const loginUrl = new URL("/login", origin);
        loginUrl.searchParams.set("error", "oauth_error");
        return NextResponse.redirect(loginUrl);
    }

    // ── Exchange code for session ─────────────────────────────────────
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !data.user) {
        const loginUrl = new URL("/login", origin);
        loginUrl.searchParams.set("error", "oauth_error");
        return NextResponse.redirect(loginUrl);
    }

    // ── Check if user has a profile → route accordingly ───────────────
    const { data: profile } = await supabase
        .from("profiles")
        .select("goal, level, weight_kg")
        .eq("id", data.user.id)
        .maybeSingle();

    const isComplete =
        profile != null &&
        profile.goal != null &&
        profile.level != null &&
        profile.weight_kg != null;

    const destination = isComplete ? "/dashboard" : "/onboarding";
    const redirectUrl = new URL(destination, origin);

    // ── Build redirect response with session cookies ──────────────────
    const response = NextResponse.redirect(redirectUrl);

    // Copy all cookies from the Supabase response to the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        });
    });

    return response;
}
