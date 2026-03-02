/**
 * @file lib/supabase/server.ts
 * Server-side Supabase client for Server Components, Route Handlers, and Middleware.
 *
 * Uses `createServerClient` from @supabase/ssr which reads/writes cookies through
 * Next.js's `cookies()` API. Must be called inside an async Server Component or
 * Route Handler because `cookies()` is async in Next.js 15+.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";

export async function createClient() {
    // `cookies()` must be awaited in Next.js 15
    const cookieStore = await cookies();

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                // Read a single cookie by name
                getAll() {
                    return cookieStore.getAll();
                },
                // Write cookies back (called by Supabase to refresh the session token)
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // `setAll` can throw in Server Components (read-only context).
                        // This is safe to ignore because the Middleware handles session refresh.
                    }
                },
            },
        }
    );
}
