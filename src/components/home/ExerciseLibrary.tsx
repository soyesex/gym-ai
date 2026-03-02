"use client";

/**
 * @file components/home/ExerciseLibrary.tsx
 * Client Component — Exercise Library with search and category filters.
 *
 * Data flow:
 *   Server component (`/workouts/page.tsx`) fetches exercises via `getExercises()`
 *   → passes them as props here → client-side filtering by search term and category.
 *
 * Category mapping:
 *   - "Push" → exercises where `force` === "push"
 *   - "Pull" → exercises where `force` === "pull"
 *   - "Legs" → exercises targeting lower-body muscle groups
 *   - "Core" → exercises targeting abs, obliques, lower_back
 *   - "All"  → no filter applied
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Search, Dumbbell } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { useTranslation, getExerciseName } from "@/i18n";

// ── Types ──────────────────────────────────────────────────────────────────────

type Exercise = Tables<"exercises">;

/** Filter categories shown as pill buttons */
type Category = "All" | "Push" | "Pull" | "Legs" | "Core";

const CATEGORIES: Category[] = ["All", "Push", "Pull", "Legs", "Core"];

/**
 * Muscle groups that belong to the "Legs" category.
 * Mapped from the `muscle_group` enum in the database.
 */
const LEG_MUSCLES = new Set(["quads", "hamstrings", "glutes", "calves"]);

/**
 * Muscle groups that belong to the "Core" category.
 */
const CORE_MUSCLES = new Set(["abs", "obliques", "lower_back"]);

// ── Props ──────────────────────────────────────────────────────────────────────

interface ExerciseLibraryProps {
    /** Pre-fetched exercises from the server component */
    exercises: Exercise[];
}

// ── Filtering Logic ────────────────────────────────────────────────────────────

/**
 * Determines whether an exercise matches the selected category.
 * Uses `force` type for Push/Pull and `primary_muscle` for Legs/Core.
 */
function matchesCategory(exercise: Exercise, category: Category): boolean {
    if (category === "All") return true;
    if (category === "Push") return exercise.force === "push";
    if (category === "Pull") return exercise.force === "pull";
    if (category === "Legs") return LEG_MUSCLES.has(exercise.primary_muscle);
    if (category === "Core") return CORE_MUSCLES.has(exercise.primary_muscle);
    return true;
}

// ── Animation Variants ─────────────────────────────────────────────────────────

const containerVariants: Variants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.04 },
    },
};

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 300, damping: 24 },
    },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function ExerciseLibrary({ exercises }: ExerciseLibraryProps) {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<Category>("All");
    const { locale, t } = useTranslation();

    /** Filtered list — derived from search term and active category */
    const filtered = useMemo(() => {
        const query = search.toLowerCase().trim();
        return exercises.filter((ex) => {
            // Category filter
            if (!matchesCategory(ex, activeCategory)) return false;
            // Search filter — matches name (both locales), muscle, or equipment
            if (query) {
                const haystack = `${getExerciseName(ex, locale)} ${ex.name} ${ex.primary_muscle} ${ex.equipment}`.toLowerCase();
                return haystack.includes(query);
            }
            return true;
        });
    }, [exercises, search, activeCategory, locale]);

    return (
        <div className="flex flex-col min-h-screen">
            {/* ── Header ─────────────────────────────────────────────── */}
            <header className="px-5 pt-12 pb-2">
                <div className="flex items-center gap-2 mb-1">
                    <Dumbbell className="w-5 h-5" style={{ color: "#39ff14" }} />
                    <p className="text-xs tracking-[0.3em] text-white/30 uppercase">
                        Exercise
                    </p>
                </div>
                <h1 className="text-2xl font-bold text-white mb-4">Library</h1>

                {/* Search Bar */}
                <div className="relative group mb-4">
                    <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors"
                        style={{ color: search ? "#39ff14" : "rgba(255,255,255,0.3)" }}
                    />
                    <input
                        id="exercise-search"
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t("session.searchExercises")}
                        className="w-full h-12 rounded-xl pl-11 pr-4 text-sm text-white placeholder:text-white/30
                                   outline-none transition-all
                                   focus:ring-1 focus:ring-[#39ff14] focus:border-[#39ff14]"
                        style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                        }}
                    />
                </div>
            </header>

            {/* ── Category Filters ────────────────────────────────────── */}
            <div className="px-5 pb-4">
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {CATEGORIES.map((cat) => {
                        const isActive = cat === activeCategory;
                        return (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider
                                           whitespace-nowrap transition-all duration-200"
                                style={{
                                    background: isActive ? "#39ff14" : "rgba(255,255,255,0.04)",
                                    color: isActive ? "#000" : "rgba(255,255,255,0.4)",
                                    border: isActive
                                        ? "1px solid #39ff14"
                                        : "1px solid rgba(255,255,255,0.08)",
                                    boxShadow: isActive
                                        ? "0 0 12px rgba(57,255,20,0.3)"
                                        : "none",
                                }}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Exercise Grid ───────────────────────────────────────── */}
            <main className="flex-1 px-5 pb-28 overflow-y-auto">
                {filtered.length === 0 ? (
                    <EmptyState search={search} category={activeCategory} />
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${activeCategory}-${search}`}
                            className="grid grid-cols-2 gap-3"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                        >
                            {filtered.map((exercise) => (
                                <ExerciseCard key={exercise.id} exercise={exercise} />
                            ))}
                        </motion.div>
                    </AnimatePresence>
                )}
            </main>
        </div>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

/**
 * Single exercise card — Stitch-inspired design adapted to our neon-green system.
 * Shows a background image (from `ai_thumbnail_url`), muscle badge, and exercise name.
 */
function ExerciseCard({ exercise }: { exercise: Exercise }) {
    const muscleName = formatMuscle(exercise.primary_muscle);
    const hasImage = !!exercise.ai_thumbnail_url;
    const { locale } = useTranslation();
    const displayName = getExerciseName(exercise, locale);

    return (
        <motion.div
            variants={cardVariants}
            layout
            className="relative aspect-[3/4] rounded-xl overflow-hidden group cursor-pointer"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}
        >
            {/* Background image or gradient fallback */}
            {hasImage ? (
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500
                               group-hover:scale-110"
                    style={{ backgroundImage: `url(${exercise.ai_thumbnail_url})` }}
                />
            ) : (
                <div
                    className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                    style={{
                        background:
                            "linear-gradient(135deg, #0a0a0a 0%, #111111 50%, #0a0a0a 100%)",
                    }}
                >
                    <Dumbbell
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                                   w-10 h-10 opacity-10"
                    />
                </div>
            )}

            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

            {/* Muscle group badge */}
            <span
                className="absolute top-2.5 left-2.5 text-[9px] font-bold uppercase tracking-[0.12em]
                           px-2 py-0.5 rounded-sm backdrop-blur-md"
                style={{
                    color: "#39ff14",
                    background: "rgba(57,255,20,0.12)",
                    border: "1px solid rgba(57,255,20,0.25)",
                }}
            >
                {muscleName}
            </span>

            {/* Difficulty badge — only if available */}
            {exercise.difficulty && (
                <span
                    className="absolute top-2.5 right-2.5 text-[8px] font-semibold uppercase tracking-wider
                               px-1.5 py-0.5 rounded-sm"
                    style={{
                        color: "rgba(255,255,255,0.5)",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.08)",
                    }}
                >
                    {exercise.difficulty}
                </span>
            )}

            {/* Bottom: exercise name + equipment icon */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between">
                <p className="text-white font-bold text-sm leading-tight uppercase max-w-[80%]">
                    {displayName}
                </p>
                {/* Neon play-style circle — decorative, matching Stitch design */}
                <div
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{
                        background: "#39ff14",
                        boxShadow: "0 0 12px rgba(57,255,20,0.5)",
                    }}
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="black"
                        className="w-3.5 h-3.5 ml-0.5"
                    >
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>
            </div>
        </motion.div>
    );
}

/**
 * Empty state when no exercises match the current filters.
 */
function EmptyState({ search, category }: { search: string; category: Category }) {
    const { t } = useTranslation();
    return (
        <div
            className="flex flex-col items-center justify-center py-16 rounded-2xl text-center"
            style={{ border: "1px solid rgba(255,255,255,0.05)", background: "#0a0a0a" }}
        >
            <Dumbbell className="w-12 h-12 mb-4" style={{ color: "rgba(57,255,20,0.2)" }} />
            <p className="text-white font-semibold mb-1">{t("session.noExercisesMatch").replace(/ .*/, " " + t("nav.library").toLowerCase()) || "No exercises"}</p>
            <p className="text-sm text-white/30 max-w-[220px]">
                {search
                    ? `${t("session.noExercisesMatch")} "${search}"`
                    : `${t("session.noExercisesYet")} (${category})`}
            </p>
        </div>
    );
}

// ── Utilities ──────────────────────────────────────────────────────────────────

/**
 * Formats a `muscle_group` enum value into a human-readable label.
 * E.g. "lower_back" → "Lower Back", "abs" → "Abs"
 */
function formatMuscle(muscle: string): string {
    return muscle
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}
