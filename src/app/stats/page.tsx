/**
 * @file app/stats/page.tsx
 * Statistics overview — Server Component.
 *
 * Data flow:
 *   This server component fetches workouts, computes aggregates,
 *   and passes serializable props to StatsClient (Client Component)
 *   which renders the translated UI via the i18n context.
 */
import { getWorkouts } from "@/lib/supabase/queries";
import StatsClient from "./StatsClient";
import type { Tables } from "@/lib/supabase/database.types";

type Workout = Tables<"workouts">;

/** Formats seconds into a human-readable duration string */
function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

export default async function StatsPage() {
    const workouts = await getWorkouts();
    const completed = workouts.filter((w) => w.status === "completed");

    // ── Aggregate calculations ─────────────────────────────────────────────────
    const totalSessions = completed.length;
    const totalSeconds = completed.reduce((sum, w) => sum + (w.duration_seconds ?? 0), 0);
    const avgDifficulty = completed.length > 0
        ? (completed.reduce((sum, w) => sum + (w.subjective_difficulty ?? 0), 0) / completed.length).toFixed(1)
        : "—";

    // Best (longest) session
    const longestSession = completed.reduce<Workout | null>(
        (best, w) => (w.duration_seconds ?? 0) > (best?.duration_seconds ?? 0) ? w : best,
        null
    );

    // Streak: consecutive days with at least one completed workout from today backwards
    const completedDates = new Set(
        completed.map((w) =>
            w.started_at ? new Date(w.started_at).toDateString() : null
        ).filter(Boolean)
    );
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        if (completedDates.has(d.toDateString())) {
            streak++;
        } else if (i > 0) {
            break;
        }
    }

    // ── Build props for the client component ───────────────────────────────────
    // Icons are passed as string identifiers because React components can't
    // be serialized across the Server → Client boundary.
    const stats = [
        { iconId: "CheckCircle2", labelKey: "sessions", value: String(totalSessions), color: "#39ff14" },
        { iconId: "Clock3", labelKey: "totalTime", value: totalSeconds > 0 ? formatDuration(totalSeconds) : "—", color: "#60a5fa" },
        { iconId: "Zap", labelKey: "avgDifficulty", value: `${avgDifficulty}/10`, color: "#f59e0b" },
        { iconId: "Flame", labelKey: "currentStreak", value: `${streak}d`, color: "#f97316" },
    ];

    const longestSessionProp = longestSession
        ? {
            id: longestSession.id,
            name: longestSession.name,
            startedAt: longestSession.started_at,
            durationFormatted: formatDuration(longestSession.duration_seconds ?? 0),
        }
        : null;

    const recentSessions = completed.slice(0, 5).map((w) => ({
        id: w.id,
        name: w.name,
        startedAt: w.started_at,
        durationFormatted: formatDuration(w.duration_seconds ?? 0),
        difficulty: w.subjective_difficulty,
    }));

    return (
        <StatsClient
            stats={stats}
            longestSession={longestSessionProp}
            recentSessions={recentSessions}
            hasCompletedSessions={completed.length > 0}
        />
    );
}
