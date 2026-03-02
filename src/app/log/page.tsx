/**
 * @file app/log/page.tsx
 * Server Component — lists the user's past and active workout sessions.
 *
 * This was previously at `/workouts/page.tsx`. After the route restructuring,
 * `/workouts` now serves the Exercise Library, and this Training Log lives
 * at `/log`. The FAB "+" in BottomNav routes here.
 *
 * Empty state shows a motivational prompt pointing to "Start Workout".
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getWorkouts, getProfile, isProfileComplete } from "@/lib/supabase/queries";
import BottomNav from "@/components/home/BottomNav";
import { Plus, Dumbbell, CheckCircle2, Clock3, Zap } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import type { Locale } from "@/i18n";
import en from "@/i18n/en.json";
import es from "@/i18n/es.json";

type Workout = Tables<"workouts">;

function getDict(locale: Locale) {
    return locale === "es" ? es : en;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return s === 0 ? `${m} min` : `${m}m ${s}s`;
}

function formatDate(isoString: string | null): string {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
}

const STATUS_CONFIG: Record<
    NonNullable<Workout["status"]>,
    { label: string; color: string }
> = {
    active: { label: "Active", color: "#facc15" },
    planned: { label: "Planned", color: "#60a5fa" },
    completed: { label: "Completed", color: "#39ff14" },
    skipped: { label: "Skipped", color: "rgba(255,255,255,0.3)" },
};

// ── Component ──────────────────────────────────────────────────────────────────

export default async function TrainingLogPage() {
    // Onboarding guard — redirect if profile is incomplete
    const profile = await getProfile();
    if (!isProfileComplete(profile)) {
        redirect("/onboarding");
    }

    const workouts = await getWorkouts();

    const cookieStore = await cookies();
    const locale = (cookieStore.get("gym-ai-locale")?.value ?? "en") as Locale;
    const dict = getDict(locale);

    return (
        <main
            className="min-h-screen pb-24"
            style={{ background: "#000", maxWidth: "480px", margin: "0 auto" }}
        >
            {/* Header */}
            <div className="px-5 pt-12 pb-4 flex items-center justify-between">
                <div>
                    <p className="text-xs tracking-[0.3em] text-white/30 uppercase mb-0.5">
                        {dict.log.trainingLog}
                    </p>
                    <h1 className="text-2xl font-bold text-white">{dict.log.workouts}</h1>
                </div>

                {/* "Start Workout" FAB */}
                <Link
                    href="/workouts/new"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all hover:brightness-110"
                    style={{ background: "#39ff14", color: "#000" }}
                >
                    <Plus className="w-4 h-4" />
                    {dict.log.start}
                </Link>
            </div>

            {/* List */}
            <div className="px-5 space-y-3">
                {workouts.length === 0 ? (
                    <EmptyState dict={dict} />
                ) : (
                    workouts.map((w) => <WorkoutCard key={w.id} workout={w} dict={dict} />)
                )}
            </div>

            <BottomNav />
        </main>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function EmptyState({ dict }: { dict: typeof en }) {
    return (
        <div
            className="flex flex-col items-center justify-center py-16 rounded-2xl text-center"
            style={{ border: "1px solid rgba(255,255,255,0.05)", background: "#0a0a0a" }}
        >
            <Dumbbell className="w-12 h-12 mb-4" style={{ color: "rgba(57,255,20,0.3)" }} />
            <p className="text-white font-semibold mb-1">{dict.log.noSessionsYet}</p>
            <p className="text-sm text-white/30 mb-6 max-w-[200px]">
                {dict.log.everyGreatPhysique}
            </p>
            <Link
                href="/workouts/new"
                className="px-5 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: "#39ff14", color: "#000" }}
            >
                {dict.log.startFirstWorkout}
            </Link>
        </div>
    );
}

function WorkoutCard({ workout: w, dict }: { workout: Workout; dict: typeof en }) {
    const statusRaw = w.status ?? "active";
    const statusCfg = STATUS_CONFIG[statusRaw];
    const statusLabel = dict.log[statusRaw as keyof typeof dict.log] || statusCfg.label;
    const isActive = w.status === "active";

    return (
        <Link
            href={`/workouts/${w.id}`}
            className="block rounded-2xl overflow-hidden transition-all hover:brightness-105"
            style={{ border: "1px solid rgba(255,255,255,0.06)", background: "#0a0a0a" }}
        >
            <div className="px-4 py-4">
                {/* Name + status badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="text-sm font-bold text-white leading-tight">{w.name}</p>
                    <span
                        className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                            color: statusCfg.color,
                            background: `${statusCfg.color}18`,
                            border: `1px solid ${statusCfg.color}40`,
                        }}
                    >
                        {isActive ? "▶ " : ""}{statusLabel}
                    </span>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-4 text-xs text-white/35">
                    <span className="flex items-center gap-1">
                        <Clock3 className="w-3 h-3" />
                        {w.status === "completed"
                            ? formatDuration(w.duration_seconds ?? 0)
                            : dict.log.inProgress}
                    </span>
                    <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {formatDate(w.started_at)}
                    </span>
                    {w.subjective_difficulty != null && (
                        <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            RPE {w.subjective_difficulty}/10
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
