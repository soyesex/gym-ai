/**
 * @file app/stats/page.tsx
 * Statistics overview — Server Component.
 *
 * Data flow:
 *   This server component fetches workouts, computes aggregates,
 *   and passes serializable props to StatsClient (Client Component)
 *   which renders the translated UI via the i18n context.
 */
import { getWorkouts, getChartVolumeData } from "@/lib/supabase/queries";
import StatsClient from "./StatsClient";
import type { Tables } from "@/lib/supabase/database.types";
import type { WeeklySessionPoint, WeeklyVolumePoint, DurationPoint } from "./StatsClient";

type Workout = Tables<"workouts">;

/** Formats seconds into a human-readable duration string */
function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

/** Returns the ISO week number (1-53) for a given Date. */
function getISOWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/** Returns an ISO week key string like "2025-W23". */
function isoWeekKey(date: Date): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const year = d.getUTCFullYear();
    const week = getISOWeek(new Date(date));
    return `${year}-W${String(week).padStart(2, "0")}`;
}

/** Returns array of the last N ISO week keys, oldest first. */
function getLast8WeekKeys(): string[] {
    const keys: string[] = [];
    const today = new Date();
    for (let i = 7; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i * 7);
        keys.push(isoWeekKey(d));
    }
    return keys;
}

/** Returns the short display label for an ISO week key, e.g. "W23". */
function weekDisplayLabel(key: string): string {
    const match = key.match(/W(\d+)$/);
    return match ? `W${match[1]}` : key;
}

export default async function StatsPage() {
    let workouts: Workout[];
    try {
        workouts = await getWorkouts();
    } catch (err) {
        console.error("[StatsPage] Data fetch failed:", err);
        throw new Error("Failed to load stats data");
    }
    const completed = workouts.filter((w) => w.status === "completed");

    // -- Chart data: fetch volume for completed workouts in the last 8 weeks ----
    const weekKeys = getLast8WeekKeys();
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    const recentCompleted = completed.filter(
        (w) => w.started_at && new Date(w.started_at) >= eightWeeksAgo
    );
    const recentIds = recentCompleted.map((w) => w.id);
    const volumeMap = await getChartVolumeData(recentIds);

    // -- Aggregate calculations -------------------------------------------------
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

    // -- Build props for the client component -----------------------------
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
            name_es: longestSession.name_es,
            startedAt: longestSession.started_at,
            durationFormatted: formatDuration(longestSession.duration_seconds ?? 0),
        }
        : null;

    const recentSessions = [
        // Active sessions first
        ...workouts
            .filter((w) => w.status === "active")
            .slice(0, 2)
            .map((w, i) => ({
                id: w.id,
                name: w.name,
                name_es: w.name_es,
                startedAt: w.started_at,
                durationFormatted: "—",
                difficulty: null as number | null,
                status: "active" as const,
                colorIdx: i,
            })),
        // Then recent completed
        ...completed.slice(0, 5).map((w) => ({
            id: w.id,
            name: w.name,
            name_es: w.name_es,
            startedAt: w.started_at,
            durationFormatted: formatDuration(w.duration_seconds ?? 0),
            difficulty: w.subjective_difficulty,
            status: "completed" as const,
            colorIdx: -1,
        })),
    ];

    // -- Chart 1: sessions per week (last 8 weeks) -----------------------------
    const sessionCountByWeek = new Map<string, number>();
    for (const w of completed) {
        if (!w.started_at) continue;
        const key = isoWeekKey(new Date(w.started_at));
        sessionCountByWeek.set(key, (sessionCountByWeek.get(key) ?? 0) + 1);
    }
    const weeklySessionsData: WeeklySessionPoint[] = weekKeys.map((key) => ({
        week: weekDisplayLabel(key),
        count: sessionCountByWeek.get(key) ?? 0,
    }));

    // -- Chart 2: weekly volume in kg (last 8 weeks) ---------------------------
    const volumeByWeek = new Map<string, number>();
    for (const w of recentCompleted) {
        if (!w.started_at) continue;
        const key = isoWeekKey(new Date(w.started_at));
        const vol = volumeMap.get(w.id) ?? 0;
        volumeByWeek.set(key, (volumeByWeek.get(key) ?? 0) + vol);
    }
    const weeklyVolumeData: WeeklyVolumePoint[] = weekKeys.map((key) => ({
        week: weekDisplayLabel(key),
        volumeKg: Math.round(volumeByWeek.get(key) ?? 0),
    }));

    // -- Chart 3: duration of last 10 completed sessions (chronological) -------
    const sessionDurationData: DurationPoint[] = completed
        .filter((w) => w.duration_seconds != null && w.duration_seconds > 0)
        .slice(0, 10)
        .reverse()
        .map((w) => ({
            startedAt: w.started_at,
            minutes: Math.round((w.duration_seconds ?? 0) / 60),
        }));

    return (
        <StatsClient
            stats={stats}
            longestSession={longestSessionProp}
            recentSessions={recentSessions}
            hasCompletedSessions={completed.length > 0}
            hasAnySessions={recentSessions.length > 0}
            weeklySessionsData={weeklySessionsData}
            weeklyVolumeData={weeklyVolumeData}
            sessionDurationData={sessionDurationData}
        />
    );
}
