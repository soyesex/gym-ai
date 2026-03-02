/**
 * @file middleware.ts
 * Next.js Middleware — runs on every request before it hits a page or API route.
 *
 * Responsibilities:
 * 1. Refresh the Supabase session token on every request (keeps the user logged in).
 * 2. Protect private routes: redirect unauthenticated users to /login.
 * 3. Redirect authenticated users away from /login back to the home page.
 *    (First-time onboarding detection happens in app/page.tsx, not here,
 *     to avoid middleware complexity and keep routing logic colocated with pages.)
 *
 * Data flow:
 *   Request → Middleware reads session cookie → refreshes token if needed
 *   → writes updated cookie to response → Next.js renders the page.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that logged-in users should NOT see (auth pages)
const AUTH_ROUTES = ["/login", "/signup"];

// Routes that REQUIRE authentication — exact or prefix (must be followed by "/" or end of string)
const PROTECTED_ROUTES = ["/", "/onboarding", "/profile", "/workouts", "/log", "/stats"];

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    // Build the Supabase server client that reads/writes cookies via the middleware
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    // Write updated cookies onto both the request (for downstream middleware)
                    // and the response (so the browser gets them back)
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

    // IMPORTANT: getUser() must be called to refresh the Auth token.
    // Do not remove this line — without it the session silently expires.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // Exact match for "/" or segment-aware prefix match (avoids "/log" matching "/login")
    const isProtected = PROTECTED_ROUTES.some((route) =>
        route === "/" ? pathname === "/" : pathname === route || pathname.startsWith(route + "/")
    );

    // Public auth routes — skip all guards if the user is already on one
    const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));

    // If not logged in and accessing a protected route → send to /login
    if (!user && isProtected) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        return NextResponse.redirect(loginUrl);
    }

    // If logged in and trying to access an auth route → send to home
    if (user && isAuthRoute) {
        const homeUrl = request.nextUrl.clone();
        homeUrl.pathname = "/";
        return NextResponse.redirect(homeUrl);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        // Run on all routes except Next.js internals and static files
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
