/**
 * @file app/api/auth/signup/route.ts
 * Server-side sign-up API route.
 *
 * Accepts: POST { email, password, username }
 *
 * Flow:
 *   1. Validate password strength + HIBP breach check
 *   2. If invalid → return { error: errorKey }
 *   3. If valid → call supabase.auth.signUp() from the server
 *   4. Return session data or error
 *
 * Rate limiting:
 *   Simple in-memory Map — 5 requests per IP per minute.
 *   Good enough for single-instance (Vercel serverless warm starts).
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { validatePassword } from "@/lib/auth/password-validation";

// ── In-memory rate limiting ──────────────────────────────────────────────────

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5; // max 5 requests per IP per window

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitStore.get(ip);

    if (!entry || now > entry.resetAt) {
        rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return false;
    }

    entry.count++;
    return entry.count > RATE_LIMIT_MAX;
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    // Rate limit by IP
    const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";

    if (isRateLimited(ip)) {
        return NextResponse.json(
            { error: "auth.rateLimited" },
            { status: 429 }
        );
    }

    // Parse body
    let body: { email?: string; password?: string; username?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "auth.invalidRequest" },
            { status: 400 }
        );
    }

    const { email, password, username } = body;

    if (!email || !password) {
        return NextResponse.json(
            { error: "auth.invalidRequest" },
            { status: 400 }
        );
    }

    // ── Step 1: Validate password (strength + HIBP) ──────────────────
    const validation = await validatePassword(password);
    if (!validation.valid) {
        return NextResponse.json(
            { error: validation.errorKey },
            { status: 422 }
        );
    }

    // ── Step 2: Sign up via Supabase ─────────────────────────────────
    const supabaseResponse = NextResponse.json({});

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        supabaseResponse.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    const cleanUsername = username?.trim().toLowerCase() || "";

    const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: cleanUsername ? { username: cleanUsername } : undefined,
        },
    });

    if (signUpError) {
        return NextResponse.json(
            { error: signUpError.message },
            { status: 400 }
        );
    }

    // Build response with session data
    const responseBody = {
        user: data.user
            ? { id: data.user.id, email: data.user.email }
            : null,
        session: data.session ? true : false,
    };

    const response = NextResponse.json(responseBody, { status: 200 });

    // Copy session cookies from the Supabase response
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
