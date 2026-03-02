/**
 * @file app/workouts/[id]/WorkoutSummary.tsx
 * Read-only summary displayed when a workout is completed.
 * Shows total duration, difficulty rating, and the logged sets grouped by exercise.
 */
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, Zap } from "lucide-react";
import BottomNav from "@/components/home/BottomNav";
import type { WorkoutWithSets } from "@/lib/supabase/queries";

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function formatDate(isoString: string | null): string {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });
}

export default function WorkoutSummary({ workout }: { workout: WorkoutWithSets }) {
    // Group sets by exercise for display
    const groups = new Map<string, { name: string; sets: WorkoutWithSets["sets"] }>();
    for (const set of workout.sets) {
        const key = set.exercise_id;
        if (!groups.has(key)) {
            groups.set(key, { name: set.exercises.name, sets: [] });
        }
        groups.get(key)!.sets.push(set);
    }

    return (
        <main
            className="min-h-screen pb-24"
            style={{ background: "#000", maxWidth: "480px", margin: "0 auto" }}
        >
            {/* Header */}
            <div className="px-5 pt-12 pb-6">
                <Link
                    href="/log"
                    className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Training Log
                </Link>

                {/* Completed badge */}
                <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-3"
                    style={{ background: "rgba(57,255,20,0.1)", color: "#39ff14", border: "1px solid rgba(57,255,20,0.2)" }}
                >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completed
                </div>

                <h1 className="text-2xl font-bold text-white mb-1">{workout.name}</h1>
                <p className="text-sm text-white/35">{formatDate(workout.started_at)}</p>

                {/* Stats row */}
                <div className="flex gap-6 mt-4">
                    <div>
                        <p className="text-2xl font-bold text-white">
                            {formatDuration(workout.duration_seconds ?? 0)}
                        </p>
                        <p className="text-xs text-white/35 flex items-center gap-1 mt-0.5">
                            <Clock3 className="w-3 h-3" /> Duration
                        </p>
                    </div>
                    {workout.subjective_difficulty != null && (
                        <div>
                            <p className="text-2xl font-bold" style={{ color: "#39ff14" }}>
                                {workout.subjective_difficulty}
                                <span className="text-sm text-white/30">/10</span>
                            </p>
                            <p className="text-xs text-white/35 flex items-center gap-1 mt-0.5">
                                <Zap className="w-3 h-3" /> Difficulty
                            </p>
                        </div>
                    )}
                    <div>
                        <p className="text-2xl font-bold text-white">{workout.sets.length}</p>
                        <p className="text-xs text-white/35 mt-0.5">Total sets</p>
                    </div>
                </div>
            </div>

            {/* Exercise groups */}
            <div className="px-5 space-y-3">
                {[...groups.entries()].map(([, group]) => (
                    <div
                        key={group.name}
                        className="rounded-2xl overflow-hidden"
                        style={{ border: "1px solid rgba(255,255,255,0.06)", background: "#0a0a0a" }}
                    >
                        <div
                            className="px-4 py-3 border-b"
                            style={{ borderColor: "rgba(255,255,255,0.05)" }}
                        >
                            <p className="text-sm font-bold text-white">{group.name}</p>
                        </div>

                        {/* Column header */}
                        <div className="grid grid-cols-3 gap-2 px-4 py-2">
                            <p className="text-[10px] text-white/25 text-center">SET</p>
                            <p className="text-[10px] text-white/25 text-center">KG</p>
                            <p className="text-[10px] text-white/25 text-center">REPS</p>
                        </div>

                        {group.sets.map((set, i) => (
                            <div
                                key={set.id}
                                className="grid grid-cols-3 gap-2 px-4 py-2.5"
                                style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}
                            >
                                <p className="text-xs text-white/30 text-center font-mono">{i + 1}</p>
                                <p className="text-sm font-bold text-white text-center tabular-nums">
                                    {Number(set.weight_kg ?? 0).toFixed(1)}
                                </p>
                                <p className="text-sm font-bold text-white text-center tabular-nums">
                                    {set.reps ?? "—"}
                                </p>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <BottomNav />
        </main>
    );
}
