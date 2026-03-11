"use client";

/**
 * @file components/home/ExerciseLibrary.tsx
 * Client Component — Exercise Library with search, category filters, and
 * virtual scrolling for performance.
 *
 * Data flow:
 *   Server component (`/workouts/page.tsx`) fetches exercises via `getExercises()`
 *   and categories via `getExerciseCategories()` → passes them as props here →
 *   client-side filtering by search term and active category.
 *
 * Category matching is data-driven via `filter_field` / `filter_values` columns:
 *   - filter_field "all"            → show every exercise
 *   - filter_field "force"          → match exercise.force IN filter_values
 *   - filter_field "primary_muscle" → match exercise.primary_muscle IN filter_values
 *
 * Performance:
 *   All 150 exercises are kept in memory for instant client-side filtering.
 *   @tanstack/react-virtual virtualizes the grid rows so only ~10 DOM nodes
 *   are rendered at any time instead of 150+, preventing scroll jank on mobile.
 *
 * Images:
 *   Uses Next.js <Image fill> instead of CSS background-image for automatic
 *   WebP/AVIF conversion, lazy loading, and responsive srcset.
 *
 * i18n:
 *   Category labels are stored bilingually in the DB (name_en / name_es).
 *   Muscle group and difficulty labels come from the i18n JSON dictionaries.
 */

import { useState, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion } from "framer-motion";
import Image from "next/image";
import { Search, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { useTranslation, getExerciseName } from "@/i18n";

// ── Types ──────────────────────────────────────────────────────────────────────

type Exercise = Tables<"exercises">;

/** A category row from the `exercise_categories` table. */
type ExerciseCategory = Tables<"exercise_categories">;

// ── Props ──────────────────────────────────────────────────────────────────────

interface ExerciseLibraryProps {
    /** Pre-fetched exercises from the server component */
    exercises: Exercise[];
    /** Pre-fetched categories from the server component (ordered by sort_order) */
    categories: ExerciseCategory[];
}

// ── Filtering Logic ────────────────────────────────────────────────────────────

/**
 * Determines whether an exercise belongs to the selected category.
 *
 * Uses the `filter_field` column to know which exercise property to check
 * and `filter_values` for the list of qualifying DB enum values.
 */
function matchesCategory(exercise: Exercise, category: ExerciseCategory): boolean {
    if (category.filter_field === "all") return true;
    if (category.filter_field === "force") {
        return category.filter_values.includes(exercise.force ?? "");
    }
    if (category.filter_field === "primary_muscle") {
        return category.filter_values.includes(exercise.primary_muscle);
    }
    return true;
}

// ── Constants ──────────────────────────────────────────────────────────────────

/**
 * Estimated height (px) for a single virtual row (2 exercise cards).
 *
 * Cards have aspect-ratio 3/4. With max-w 480px container, 40px horizontal
 * padding, and 12px gap between columns:
 *   card width  ≈ (440 - 12) / 2 = 214px
 *   card height ≈ 214 × (4/3) = 285px
 *   row height  ≈ 285 + 12 (row gap) = 297px → rounded to 300
 */
const ESTIMATED_ROW_HEIGHT = 300;

/** Number of extra rows rendered outside the visible viewport for smooth scrolling */
const OVERSCAN_ROWS = 3;

// ── Component ──────────────────────────────────────────────────────────────────

export default function ExerciseLibrary({ exercises, categories }: ExerciseLibraryProps) {
    const { locale, t } = useTranslation();

    // Ref attached to the scrollable <main> — required by useVirtualizer
    const scrollRef = useRef<HTMLElement>(null);

    // Default to the first category (expected to be "all") or undefined
    const [activeCategory, setActiveCategory] = useState<ExerciseCategory | undefined>(
        categories[0]
    );

    const [search, setSearch] = useState("");
    const [showAllCategories, setShowAllCategories] = useState(false);

    /** Number of category pills always visible before the "show more" button */
    const VISIBLE_CAT_COUNT = 4;
    const visibleCategories = showAllCategories
        ? categories
        : categories.slice(0, VISIBLE_CAT_COUNT);
    const hiddenCount = categories.length - VISIBLE_CAT_COUNT;

    /** Filtered flat list — derived from search term and active category */
    const filtered = useMemo(() => {
        const query = search.toLowerCase().trim();
        return exercises.filter((ex) => {
            // Category filter using data-driven logic from DB
            if (activeCategory && !matchesCategory(ex, activeCategory)) return false;
            // Search filter — matches localised name, EN name, muscle, or equipment
            if (query) {
                const haystack =
                    `${getExerciseName(ex, locale)} ${ex.name} ${ex.primary_muscle} ${ex.equipment}`.toLowerCase();
                return haystack.includes(query);
            }
            return true;
        });
    }, [exercises, search, activeCategory, locale]);

    /**
     * Exercises chunked into rows of 2 for the virtual grid.
     * Each virtual row renders up to 2 `ExerciseCard` components side by side.
     */
    const rows = useMemo<Exercise[][]>(() => {
        const result: Exercise[][] = [];
        for (let i = 0; i < filtered.length; i += 2) {
            result.push(filtered.slice(i, i + 2));
        }
        return result;
    }, [filtered]);

    /** Virtual row manager — controls which rows are mounted in the DOM */
    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => ESTIMATED_ROW_HEIGHT,
        overscan: OVERSCAN_ROWS,
    });

    const virtualItems = rowVirtualizer.getVirtualItems();

    return (
        <div className="flex flex-col min-h-screen">
            {/* ── Header ─────────────────────────────────────────────── */}
            <header className="px-5 pt-12 pb-2">
                <div className="flex items-center gap-2 mb-1">
                    <Dumbbell className="w-5 h-5" style={{ color: "#39ff14" }} />
                    <p className="text-xs tracking-[0.3em] text-white/30 uppercase">
                        {t("exercise.eyebrow")}
                    </p>
                </div>
                <h1 className="text-2xl font-bold text-white mb-4">{t("nav.library")}</h1>

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
                <div className="flex flex-wrap gap-2">
                    {visibleCategories.map((cat) => {
                        const isActive = cat.id === activeCategory?.id;
                        const label = locale === "es" ? cat.name_es : cat.name_en;
                        return (
                            <button
                                key={cat.id}
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
                                {label}
                            </button>
                        );
                    })}

                    {/* Show more / show less toggle */}
                    {hiddenCount > 0 && (
                        <button
                            onClick={() => setShowAllCategories((prev) => !prev)}
                            className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider
                                       whitespace-nowrap transition-all duration-200 flex items-center gap-1"
                            style={{
                                background: "rgba(57,255,20,0.06)",
                                color: "#39ff14",
                                border: "1px solid rgba(57,255,20,0.2)",
                            }}
                        >
                            {showAllCategories ? (
                                <>
                                    <ChevronUp className="w-3 h-3" />
                                    {locale === "es" ? "Ver menos" : "See less"}
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-3 h-3" />
                                    {locale === "es" ? "Ver más" : "See more"}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* ── Exercise Grid (virtualized) ─────────────────────────── */}
            <main ref={scrollRef} className="flex-1 pb-28 overflow-y-auto">
                {filtered.length === 0 ? (
                    <div className="px-5">
                        <EmptyState
                            search={search}
                            categoryLabel={
                                activeCategory
                                    ? locale === "es"
                                        ? activeCategory.name_es
                                        : activeCategory.name_en
                                    : ""
                            }
                        />
                    </div>
                ) : (
                    /*
                     * Outer div: full virtual height so the scrollbar reflects the
                     * total content size. Inner div: shifts the visible rows to the
                     * correct scroll position using translateY.
                     */
                    <div
                        style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                transform: `translateY(${virtualItems[0]?.start ?? 0}px)`,
                            }}
                        >
                            {virtualItems.map((virtualRow) => (
                                <div
                                    key={virtualRow.key}
                                    data-index={virtualRow.index}
                                    ref={rowVirtualizer.measureElement}
                                    className="grid grid-cols-2 gap-3 px-5 pb-3"
                                >
                                    {rows[virtualRow.index].map((exercise) => (
                                        <ExerciseCard key={exercise.id} exercise={exercise} />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

/** Fade-in variant used by each card entering the viewport */
const cardVariants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: "spring" as const, stiffness: 280, damping: 22 },
    },
};

/**
 * Single exercise card — dark neon design.
 *
 * Uses Next.js `<Image fill>` for optimized image loading (WebP, lazy, srcset).
 * Falls back to a gradient placeholder when no thumbnail exists yet.
 */
function ExerciseCard({ exercise }: { exercise: Exercise }) {
    const { locale, t } = useTranslation();
    const hasImage = !!exercise.ai_thumbnail_url;
    const displayName = getExerciseName(exercise, locale);
    const muscleName = t(`muscles.${exercise.primary_muscle}`);
    const difficultyLabel = exercise.difficulty ? t(`levels.${exercise.difficulty}`) : null;

    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="relative aspect-3/4 rounded-xl overflow-hidden group cursor-pointer"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}
        >
            {/* Background: optimized image or gradient fallback */}
            {hasImage ? (
                <Image
                    src={exercise.ai_thumbnail_url!}
                    alt={exercise.name}
                    fill
                    sizes="(max-width: 480px) 50vw, 240px"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
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
            <div className="absolute inset-0 bg-linear-to-t from-black via-black/30 to-transparent" />

            {/* Category + Difficulty badges */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex flex-wrap gap-1">
                <span
                    className="text-[9px] font-bold uppercase tracking-[0.12em]
                               px-2 py-0.5 rounded-sm backdrop-blur-md"
                    style={{
                        color: "#39ff14",
                        background: "rgba(57,255,20,0.12)",
                        border: "1px solid rgba(57,255,20,0.25)",
                    }}
                >
                    {muscleName}
                </span>

                {difficultyLabel && (
                    <span
                        className="text-[8px] font-semibold uppercase tracking-wider
                                   px-1.5 py-0.5 rounded-sm"
                        style={{
                            color: "rgba(255,255,255,0.5)",
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.08)",
                        }}
                    >
                        {difficultyLabel}
                    </span>
                )}
            </div>

            {/* Bottom: exercise name + neon play button */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between">
                <p className="text-white font-bold text-sm leading-tight uppercase max-w-[80%]">
                    {displayName}
                </p>
                <div
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{
                        background: "#39ff14",
                        boxShadow: "0 0 12px rgba(57,255,20,0.5)",
                    }}
                >
                    <svg viewBox="0 0 24 24" fill="black" className="w-3.5 h-3.5 ml-0.5">
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
function EmptyState({ search, categoryLabel }: { search: string; categoryLabel: string }) {
    const { t } = useTranslation();
    return (
        <div
            className="flex flex-col items-center justify-center py-16 rounded-2xl text-center"
            style={{ border: "1px solid rgba(255,255,255,0.05)", background: "#0a0a0a" }}
        >
            <Dumbbell className="w-12 h-12 mb-4" style={{ color: "rgba(57,255,20,0.2)" }} />
            <p className="text-white font-semibold mb-1">{t("session.noExercisesMatch")}</p>
            <p className="text-sm text-white/30 max-w-55">
                {search ? `"${search}"` : categoryLabel}
            </p>
        </div>
    );
}
