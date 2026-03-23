/**
 * @file app/auth/reset-password/route.ts
 * Server-side Route Handler for password reset — PKCE flow.
 *
 * Flow:
 *   1. Supabase sends a reset email with a link to /auth/reset-password?code=XYZ
 *   2. This handler exchanges the code for a session to validate it.
 *   3. Stores the user_id in a short-lived httpOnly cookie ("reset-uid").
 *   4. Redirects to /auth/reset-password/form where a Server Action
 *      reads the cookie and uses admin.updateUserById() to set the new password.
 *
 * This avoids client-side session issues — the form never needs a Supabase session.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
    const { searchParams, origin } = request.nextUrl;
    const code = searchParams.get("code");

    // No code in URL → expired/invalid link
    if (!code) {
        return NextResponse.redirect(
            new URL("/auth/reset-password/form?error=expired", origin)
        );
    }

    // ── Exchange code for session (validates the reset token) ─────────
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

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
        return NextResponse.redirect(
            new URL("/auth/reset-password/form?error=expired", origin)
        );
    }

    // ── Store user_id in a short-lived httpOnly cookie ────────────────
    // The Server Action in the form page reads this to call admin.updateUserById()
    const redirectUrl = new URL("/auth/reset-password/form", origin);
    const response = NextResponse.redirect(redirectUrl);

    response.cookies.set("reset-uid", data.user.id, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 600, // 10 minutes — enough time to fill the form
    });

    return response;
}
