/**
 * @file lib/supabase/admin.ts
 * Admin-level Supabase client — uses the SERVICE_ROLE_KEY.
 *
 * ⚠️  This client bypasses RLS and has full access to all data.
 *     It must ONLY be used in server-side code (API routes, Server Actions).
 *     NEVER import this from a Client Component.
 *
 * Used for:
 *   - Looking up user identity providers (e.g., is this a Google-only account?)
 *   - Any admin-level auth operations
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export function createAdminClient() {
    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}
