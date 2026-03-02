/**
 * @file lib/supabase/client.ts
 * Browser-side Supabase client.
 *
 * Created with `createBrowserClient` from @supabase/ssr so that cookies
 * are managed automatically on every request/response cycle in Next.js.
 * This singleton is safe to call from Client Components ("use client").
 */
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

export function createClient() {
    // These env vars are injected at build time by Next.js (NEXT_PUBLIC_ prefix).
    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
