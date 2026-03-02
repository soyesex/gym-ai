"use client";

import { useState } from "react";

/**
 * @file components/home/HomeClient.tsx
 * The main dashboard shell — a Client Component.
 *
 * Receives pre-fetched server data as props (profile, weeklyStats)
 * and handles all client-side concerns: logout, animations, user interactions.
 *
 * ┌───────────────────────────────────────────────────────────────┐
 * │ Sections (top → bottom):                                     │
 * │  1. Header — welcome + level badge + logout                  │
 * │  2. Resume Banner (if active workout exists)                 │
 * │  3. Training Protocol — weekly progress, XP, stats grid      │
 * │  4. Recommended Modules — AI-curated routine cards           │
 * │  5. BottomNav                                                │
 * └───────────────────────────────────────────────────────────────┘
 *
 * The Biometric Telemetry and Exercise Library sections were moved
 * to the Profile page as part of the product-strategy refactor.
 */
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Cpu, TrendingUp, LogOut, Play } from "lucide-react";
import { useTranslation } from "@/i18n";
import RecommendedModuleCard from "@/components/home/RecommendedModuleCard";
import BottomNav from "@/components/home/BottomNav";
import { createClient } from "@/lib/supabase/client";
import { startRecommendedWorkout } from "@/app/workouts/actions";
import type { Tables } from "@/lib/supabase/database.types";
import type { RecommendedModule } from "@/lib/ai/types";

// Mock data removed — modules now come from the RAG pipeline via props.

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface HomeClientProps {
    /** User email from auth.users — used as display name fallback */
    authEmail: string | null;
    profile: Tables<"profiles"> | null;
    weeklyStats: { completed: number; totalDurationSeconds: number };
    /** The first workout with status='active', if any — drives the resume banner */
    activeWorkout: Tables<"workouts"> | null;
    /** AI-generated training modules from the RAG pipeline (may be empty) */
    recommendedModules: RecommendedModule[];
}

// Shared fade-up animation variant for sections
const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
};

// Level keys — map DB enum values to translation keys in the `levels` namespace
const LEVEL_KEYS: Record<string, string> = {
    sedentary: "levels.sedentary",
    beginner: "levels.beginner",
    intermediate: "levels.intermediate",
    advanced: "levels.advanced",
    elite: "levels.elite",
};

// ---------------------------------------------------------------------------

export default function HomeClient({ authEmail, profile, weeklyStats, activeWorkout, recommendedModules }: HomeClientProps) {
    const router = useRouter();
    const { t } = useTranslation();
    const supabase = createClient();

    // Tracks which module card is currently being started (by module id)
    const [startingModuleId, setStartingModuleId] = useState<string | null>(null);

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    }

    /**
     * Converts a recommended module into a live workout session.
     * Called when the user taps START on a RecommendedModuleCard.
     *
     * Flow: sets loading → calls server action → navigates to /workouts/[id]
     */
    async function handleStartModule(mod: RecommendedModule) {
        setStartingModuleId(mod.id);

        try {
            // Map from RecommendedModule to the server action's expected payload
            const result = await startRecommendedWorkout({
                title: mod.name,
                exercises: mod.exercises.map((ex) => ({
                    id: ex.id,
                    name: ex.name,
                    sets: ex.sets,
                    reps: ex.reps,
                    restSeconds: ex.restSeconds,
                })),
            });

            if (result.success) {
                // Navigate to the live workout session
                router.push(`/workouts/${result.data.id}`);
            } else {
                console.error("[HomeClient] Failed to start workout:", result.message);
                // Reset loading so the user can try again
                setStartingModuleId(null);
            }
        } catch (err) {
            console.error("[HomeClient] Error starting workout:", err);
            setStartingModuleId(null);
        }
    }

    // ── Derived display values ───────────────────────────────────────────────

    // Display name priority: full_name > username > email prefix > "Agent"
    const emailPrefix = authEmail?.split("@")[0] ?? null;
    const displayName = profile?.full_name ?? profile?.username ?? emailPrefix ?? "Agent";

    // XP progress within the current level (0-1000 XP = Level 1, 1000-2000 = Level 2…)
    const xp = profile?.current_xp ?? 0;
    const level = profile?.current_level ?? 1;
    const xpInCurrentLevel = xp % 1000;
    const xpProgressPercent = Math.round((xpInCurrentLevel / 1000) * 100);

    // Weekly training days goal from profile
    const targetDays = profile?.days_per_week ?? 5;
    const weeklyProgressPercent = Math.round((weeklyStats.completed / targetDays) * 100);

    // Total training minutes this week
    const weeklyMinutes = Math.round(weeklyStats.totalDurationSeconds / 60);

    // Experience level label — translated via dictionary
    const levelKey = LEVEL_KEYS[profile?.level ?? "beginner"] ?? "levels.beginner";
    const levelLabel = t(levelKey).toUpperCase();

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <main
            className="min-h-screen pb-24"
            style={{ background: "#000", maxWidth: "480px", margin: "0 auto" }}
        >
            {/* ── Header ────────────────────────────────────────── */}
            <motion.header
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-between px-5 pt-12 pb-4"
            >
                <div>
                    <p className="text-xs tracking-[0.3em] text-white/40 uppercase mb-1">
                        {t("home.welcomeBack")}
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#39ff14" }}>
                        {displayName}
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <Badge
                        className="text-xs font-bold border-none px-3 py-1"
                        style={{ backgroundColor: "rgba(57,255,20,0.12)", color: "#39ff14" }}
                    >
                        <Cpu className="w-3 h-3 mr-1" />
                        {levelLabel}
                    </Badge>
                    <button
                        id="btn-logout"
                        onClick={handleLogout}
                        title="Log out"
                        className="p-2 rounded-xl transition-colors hover:bg-white/10"
                        style={{ background: "rgba(255,255,255,0.05)" }}
                    >
                        <LogOut className="w-5 h-5 text-white/60" />
                    </button>
                </div>
            </motion.header>

            {/* ── Resume Active Workout Banner ─────────────────────── */}
            {activeWorkout && (
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.05, duration: 0.4, ease: "easeOut" }}
                    className="mx-5 mb-4"
                >
                    <Link
                        href={`/workouts/${activeWorkout.id}`}
                        className="flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all hover:brightness-110"
                        style={{
                            background: "rgba(57,255,20,0.07)",
                            border: "1.5px solid rgba(57,255,20,0.35)",
                        }}
                    >
                        <div className="flex items-center gap-3">
                            {/* Pulsing dot */}
                            <span className="relative flex h-2.5 w-2.5">
                                <span
                                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                                    style={{ background: "#39ff14" }}
                                />
                                <span
                                    className="relative inline-flex rounded-full h-2.5 w-2.5"
                                    style={{ background: "#39ff14" }}
                                />
                            </span>
                            <div>
                                <p className="text-xs font-bold" style={{ color: "#39ff14" }}>
                                    {t("home.activeSession")}
                                </p>
                                <p className="text-sm text-white font-semibold truncate max-w-[180px]">
                                    {activeWorkout.name}
                                </p>
                            </div>
                        </div>
                        <div
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl"
                            style={{ background: "#39ff14", color: "#000" }}
                        >
                            <Play className="w-3.5 h-3.5" />
                            {t("home.resume")}
                        </div>
                    </Link>
                </motion.div>
            )}

            {/* ── Training Protocol Banner ───────────────────────── */}
            <motion.section
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
                className="mx-5 mb-6"
            >
                <div
                    className="rounded-2xl p-5 relative overflow-hidden"
                    style={{
                        background: "#0a0a0a",
                        border: "1px solid rgba(57,255,20,0.12)",
                    }}
                >
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-xs tracking-widest text-white/40 uppercase mb-1">
                                {t("home.trainingProtocol")}
                            </p>
                            <h2 className="text-lg font-bold text-white">
                                {t("home.level")} {level} · {levelLabel}
                            </h2>
                        </div>
                        {/* XP badge — shows progress within current level */}
                        <Badge
                            className="text-xs border-none"
                            style={{ backgroundColor: "rgba(57,255,20,0.15)", color: "#39ff14" }}
                        >
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {xp} XP
                        </Badge>
                    </div>

                    <div className="space-y-3">
                        {/* Weekly Progress bar */}
                        <div>
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-white/50">{t("home.weeklyProgress")}</span>
                                <span className="font-bold" style={{ color: "#39ff14" }}>
                                    {weeklyStats.completed}/{targetDays} {t("home.sessionsCount")}
                                </span>
                            </div>
                            <Progress
                                value={weeklyProgressPercent}
                                className="h-1.5 [&>div]:bg-[#39ff14]"
                                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                            />
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-3 gap-3 pt-1">
                            {[
                                { label: t("home.sessions"), value: `${weeklyStats.completed}/${targetDays}` },
                                { label: t("home.minutes"), value: weeklyMinutes > 0 ? `${weeklyMinutes}m` : "—" },
                                { label: t("home.xpLevel"), value: `${xpProgressPercent}%` },
                            ].map(({ label, value }) => (
                                <div
                                    key={label}
                                    className="rounded-xl p-2.5 text-center"
                                    style={{ background: "rgba(255,255,255,0.04)" }}
                                >
                                    <p className="text-base font-bold" style={{ color: "#39ff14" }}>
                                        {value}
                                    </p>
                                    <p className="text-[10px] text-white/40 mt-0.5">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA — navigates to /workouts/new to start a session */}
                    <Link
                        href="/workouts/new"
                        className="w-full mt-4 py-3.5 rounded-xl font-bold tracking-widest text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110"
                        style={{ backgroundColor: "#39ff14", color: "#000" }}
                    >
                        <Play className="w-4 h-4" />
                        {t("home.startWorkout")}
                    </Link>
                </div>
            </motion.section>

            {/* ── Recommended Modules ─────────────────────────────── */}
            <motion.section
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                className="px-5 mb-6"
            >
                <div className="mb-4">
                    <p className="text-xs tracking-widest text-white/40 uppercase mb-0.5">
                        {t("home.aiCurated")}
                    </p>
                    <h2 className="text-base font-bold text-white">
                        {t("home.recommendedModules")}
                    </h2>
                </div>

                <div className="space-y-4">
                    {recommendedModules.length > 0 ? (
                        recommendedModules.map((routine, i) => (
                            <RecommendedModuleCard
                                key={routine.id}
                                routine={routine}
                                index={i}
                                onStart={() => handleStartModule(routine)}
                                isLoading={startingModuleId === routine.id}
                            />
                        ))
                    ) : (
                        <div
                            className="rounded-2xl p-6 text-center"
                            style={{
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.06)",
                            }}
                        >
                            <p className="text-white/40 text-sm">
                                {t("home.generatingModules")}
                            </p>
                            <p className="text-white/25 text-xs mt-1">
                                {t("home.ensureEmbeddings")}
                            </p>
                        </div>
                    )}
                </div>
            </motion.section>

            <BottomNav />
        </main>
    );
}
