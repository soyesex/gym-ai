"use client";

/**
 * @file components/home/RecommendedModuleCard.tsx
 * Visually-rich card for AI-recommended workout routines.
 *
 * Each card displays:
 * - A dark gradient background (placeholder for future AI-generated thumbnails)
 * - A match-percentage badge (top-right corner)
 * - Routine name, difficulty, exercise count
 * - A prominent START call-to-action with loading spinner
 *
 * Uses Framer Motion for staggered entrance animation, consistent
 * with the rest of the Home dashboard.
 */
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Play, Flame, Layers, Loader2 } from "lucide-react";
import { useTranslation } from "@/i18n";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of a recommended routine coming from the RAG pipeline */
export interface RecommendedRoutine {
    /** Unique id for React key */
    id: string;
    /** Routine display name (e.g. "DEADLIFT X-PROTOCOL") */
    name: string;
    /** AI-calculated match percentage (0-100) */
    matchPercent: number;
    /** Difficulty tier */
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    /** Total exercises in the routine */
    exerciseCount: number;
    /** Estimated duration in minutes */
    durationMin: number;
    /** CSS gradient for the card background */
    gradient: string;
}

interface RecommendedModuleCardProps {
    routine: RecommendedRoutine;
    /** Index for staggered animation delay */
    index?: number;
    /** Callback when the user taps START — triggers workout creation */
    onStart?: () => void;
    /** Whether the workout is being created (show spinner, disable button) */
    isLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Difficulty badge color mapping
// ---------------------------------------------------------------------------
const DIFFICULTY_STYLES: Record<string, { bg: string; text: string }> = {
    Beginner: { bg: "rgba(56,189,248,0.12)", text: "#38bdf8" },
    Intermediate: { bg: "rgba(250,204,21,0.12)", text: "#facc15" },
    Advanced: { bg: "rgba(239,68,68,0.12)", text: "#ef4444" },
};

/** Maps the difficulty enum to the corresponding i18n key */
const DIFFICULTY_KEYS: Record<string, string> = {
    Beginner: "home.beginner",
    Intermediate: "home.intermediate",
    Advanced: "home.advanced",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RecommendedModuleCard({
    routine,
    index = 0,
    onStart,
    isLoading = false,
}: RecommendedModuleCardProps) {
    const diffStyle = DIFFICULTY_STYLES[routine.difficulty] ?? DIFFICULTY_STYLES.Beginner;
    const { t } = useTranslation();
    const diffLabel = t(DIFFICULTY_KEYS[routine.difficulty] ?? "home.beginner");

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + index * 0.12, duration: 0.5, ease: "easeOut" }}
            whileHover={{ scale: 1.015 }}
            className="relative w-full rounded-2xl overflow-hidden cursor-pointer group"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
            {/* ── Gradient Background ────────────────────────────── */}
            <div
                className="absolute inset-0"
                style={{ background: routine.gradient }}
            />

            {/* ── Subtle animated shimmer overlay ────────────────── */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{
                    background:
                        "linear-gradient(105deg, transparent 40%, rgba(57,255,20,0.04) 50%, transparent 60%)",
                }}
            />

            {/* ── Card Content ───────────────────────────────────── */}
            <div className="relative z-10 flex flex-col justify-between p-5 min-h-[180px]">
                {/* Top row: difficulty + match badge */}
                <div className="flex items-start justify-between">
                    <Badge
                        className="text-[10px] font-bold tracking-wider border-none px-2.5 py-0.5"
                        style={{ backgroundColor: diffStyle.bg, color: diffStyle.text }}
                    >
                        {diffLabel}
                    </Badge>

                    <Badge
                        className="text-[10px] font-bold tracking-wider border-none px-2.5 py-0.5"
                        style={{
                            backgroundColor: "rgba(34,197,94,0.10)",
                            color: "#4ade80",
                        }}
                    >
                        {routine.matchPercent}% {t("home.match")}
                    </Badge>
                </div>

                {/* Bottom content */}
                <div className="mt-auto pt-4 space-y-3">
                    {/* Routine name */}
                    <h3 className="text-lg font-extrabold tracking-wide text-white leading-tight">
                        {routine.name}
                    </h3>

                    {/* Meta row: exercises & duration */}
                    <div className="flex items-center gap-4 text-white/45 text-xs">
                        <span className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            {routine.exerciseCount} {t("home.exercisesCount")}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5" style={{ color: "#f97316" }} />
                            {routine.durationMin} min
                        </span>
                    </div>

                    {/* START button — shows spinner while creating the workout */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onStart?.();
                        }}
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl font-bold tracking-widest text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{
                            backgroundColor: "#39ff14",
                            color: "#000",
                        }}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t("home.creating")}
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                {t("home.start")}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

