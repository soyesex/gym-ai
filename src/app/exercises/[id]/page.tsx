/**
 * @file app/exercises/[id]/page.tsx
 * Server Component — Exercise Detail Page.
 *
 * Renders the full detail view for a single exercise: hero image,
 * how-to steps, execution tips, common risks, and YouTube tutorial link.
 *
 * Error handling:
 *   - Non-UUID ids → notFound() (no Supabase call, no DB crash)
 *   - Exercise not found → notFound()
 *   - All Supabase calls wrapped in try/catch
 *
 * i18n: locale read from cookie, translated server-side.
 *
 * Type note: The new fields (steps, risks, youtube_url, etc.) are cast
 * via `ExerciseWithDetails` since they are added by migration and the
 * generated database.types.ts is regenerated after the migration runs.
 */

import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import {
    Dumbbell,
    ListOrdered,
    Lightbulb,
    AlertTriangle,
    Youtube,
    ChevronDown,
} from "lucide-react";

import { getExerciseById } from "@/lib/supabase/queries";
import type { Locale } from "@/i18n";
import en from "@/i18n/en.json";
import es from "@/i18n/es.json";
import LocaleToggle from "@/components/ui/LocaleToggle";
import ExerciseChatFAB from "./ExerciseChatFAB";
import BackButton from "@/components/ui/BackButton";
import type React from "react";

// ---------------------------------------------------------------------------
// Server-side i18n helper
// ---------------------------------------------------------------------------

type Dictionary = Record<string, unknown>;
const dicts: Record<Locale, Dictionary> = { en, es };

function st(key: string, locale: Locale): string {
    const parts = key.split(".");
    let cur: unknown = dicts[locale];
    for (const p of parts) {
        if (cur && typeof cur === "object" && p in (cur as Dictionary)) {
            cur = (cur as Dictionary)[p];
        } else {
            // fallback: try English
            let fb: unknown = dicts["en"];
            for (const fp of parts) {
                if (fb && typeof fb === "object" && fp in (fb as Dictionary)) {
                    fb = (fb as Dictionary)[fp];
                } else return key;
            }
            return typeof fb === "string" ? fb : key;
        }
    }
    return typeof cur === "string" ? cur : key;
}

// ---------------------------------------------------------------------------
// Extended type: base exercise + new migration fields (nullable until populated)
// ---------------------------------------------------------------------------

interface ExerciseWithDetails {
    id: string;
    name: string;
    name_es?: string | null;
    description?: string | null;
    description_es?: string | null;
    primary_muscle: string;
    difficulty?: string | null;
    force?: string | null;
    ai_thumbnail_url?: string | null;
    // ── Migration fields (null until /api/setup-exercise-details runs) ─────
    // NOTE: "tips" column does NOT exist. Use detailed_tips / detailed_tips_es.
    steps?: unknown;
    steps_es?: unknown;
    detailed_tips?: unknown;
    detailed_tips_es?: unknown;
    risks?: unknown;
    risks_es?: unknown;
    youtube_url?: string | null;
}

// ---------------------------------------------------------------------------
// Types for enriched fields
// ---------------------------------------------------------------------------

interface ExerciseStep {
    step?: string;
    en?: string;
    es?: string;
}

interface ExerciseRisk {
    title?: string;
    title_es?: string;
    description?: string;
    description_es?: string;
    avoid?: string;
    avoid_es?: string;
}

interface ExerciseTip {
    tip?: string;
    en?: string;
    es?: string;
}

// Helper to parse jsonb fields (may be string[], object[], or plain string)
function parseJsonField<T>(raw: unknown): T[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as T[];
    if (typeof raw === "string") {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? (parsed as T[]) : [];
        } catch {
            return raw.split(/\n+/).filter(Boolean).map((s) => s as unknown as T);
        }
    }
    return [];
}

// ---------------------------------------------------------------------------
// Difficulty color mapping
// ---------------------------------------------------------------------------

function getDifficultyColor(difficulty: string | null | undefined): string {
    switch (difficulty?.toLowerCase()) {
        case "beginner":
        case "novice":
            return "#39ff14";
        case "intermediate":
        case "dedicated":
            return "#fbbf24";
        case "advanced":
        case "elite":
        case "athlete":
            return "#ef4444";
        default:
            return "#888888";
    }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function ExerciseDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    // ── Locale ──────────────────────────────────────────────────────────────
    const cookieStore = await cookies();
    const locale = (cookieStore.get("gym-ai-locale")?.value ?? "es") as Locale;

    // ── Data fetch ──────────────────────────────────────────────────────────
    const rawExercise = await getExerciseById(id);
    if (!rawExercise) notFound();

    // Cast to our extended type — safe because extra fields are nullable
    const exercise = rawExercise as unknown as ExerciseWithDetails;

    // ── Derived display values ───────────────────────────────────────────────
    const displayName =
        locale === "es" && exercise.name_es ? exercise.name_es : exercise.name;

    const displayDescription =
        locale === "es" && exercise.description_es
            ? exercise.description_es
            : exercise.description;

    const difficultyKey = exercise.difficulty
        ? `exercise.difficulty.${exercise.difficulty.toLowerCase()}`
        : null;
    const difficultyLabel = difficultyKey ? st(difficultyKey, locale) : null;
    const difficultyColor = getDifficultyColor(exercise.difficulty);

    const muscleLabel = exercise.primary_muscle
        ? st(`muscles.${exercise.primary_muscle}`, locale)
        : null;

    // ── Parse enriched fields ────────────────────────────────────────────────

    // Steps
    const rawStepSource =
        locale === "es" && exercise.steps_es ? exercise.steps_es : exercise.steps;
    const steps = parseJsonField<ExerciseStep | string>(rawStepSource);

    // Tips — source: detailed_tips / detailed_tips_es ("tips" column does NOT exist)
    const rawTipSource =
        locale === "es" && exercise.detailed_tips_es
            ? exercise.detailed_tips_es
            : exercise.detailed_tips;
    const tipsArray = parseJsonField<ExerciseTip | string>(rawTipSource);

    // Risks
    const rawRiskSource =
        locale === "es" && exercise.risks_es ? exercise.risks_es : exercise.risks;
    const risks = parseJsonField<ExerciseRisk | string>(rawRiskSource);

    // YouTube URL
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${exercise.name} proper form tutorial`
    )}`;
    const resolvedYoutubeUrl = exercise.youtube_url || youtubeSearchUrl;

    // Category badge (from force field)
    const categoryLabel = exercise.force
        ? exercise.force.charAt(0).toUpperCase() + exercise.force.slice(1)
        : null;

    return (
        <div
            className="min-h-screen pb-28"
            style={{ background: "#000", maxWidth: "480px", margin: "0 auto" }}
        >
            {/* ── Sticky Header ──────────────────────────────────────────────── */}
            <header
                className="sticky top-0 z-50 flex items-center justify-between px-4 py-3"
                style={{
                    background: "rgba(0,0,0,0.85)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
            >
                <BackButton label={st("exercise.back", locale)} />

                <span
                    className="text-sm font-bold tracking-widest uppercase"
                    style={{ color: "#39ff14", textShadow: "0 0 8px rgba(57,255,20,0.4)" }}
                >
                    GYM-AI
                </span>

                <LocaleToggle />
            </header>

            {/* ── Hero Section ───────────────────────────────────────────────── */}
            <section className="px-4 pt-4">
                <div
                    className="relative overflow-hidden"
                    style={{ aspectRatio: "16/9", borderRadius: "16px" }}
                >
                    {exercise.ai_thumbnail_url ? (
                        <Image
                            src={exercise.ai_thumbnail_url}
                            alt={displayName}
                            fill
                            sizes="(max-width: 480px) 100vw, 480px"
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{
                                background:
                                    "linear-gradient(135deg, #080808 0%, #111 50%, #0a0a0a 100%)",
                            }}
                        >
                            <Dumbbell
                                className="w-16 h-16 opacity-10"
                                style={{ color: "#39ff14" }}
                            />
                        </div>
                    )}

                    {/* Gradient overlay */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)",
                        }}
                    />

                    {/* Badges + name */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex flex-wrap gap-2 mb-3">
                            {categoryLabel && (
                                <span
                                    className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md"
                                    style={{
                                        color: "#39ff14",
                                        background: "rgba(57,255,20,0.12)",
                                        border: "1px solid rgba(57,255,20,0.3)",
                                    }}
                                >
                                    {categoryLabel}
                                </span>
                            )}
                            {difficultyLabel && (
                                <span
                                    className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md"
                                    style={{
                                        color: difficultyColor,
                                        background: `${difficultyColor}18`,
                                        border: `1px solid ${difficultyColor}44`,
                                    }}
                                >
                                    {difficultyLabel}
                                </span>
                            )}
                        </div>

                        <h1
                            className="font-bold text-white leading-tight"
                            style={{ fontSize: "clamp(1.4rem, 5vw, 1.875rem)" }}
                        >
                            {displayName}
                        </h1>

                        {muscleLabel && (
                            <p className="mt-1.5 text-sm" style={{ color: "#888" }}>
                                {st("exercise.primaryMuscle", locale)}: {muscleLabel}
                            </p>
                        )}
                    </div>
                </div>

                {displayDescription && (
                    <p className="mt-3 text-sm leading-relaxed" style={{ color: "#888" }}>
                        {displayDescription}
                    </p>
                )}
            </section>

            {/* ── How To Do It ───────────────────────────────────────────────── */}
            <section className="px-4 mt-8">
                <SectionHeader
                    icon={<ListOrdered className="w-5 h-5" />}
                    label={st("exercise.howToDoIt", locale)}
                />

                {steps.length === 0 ? (
                    <EmptyState text={st("exercise.noSteps", locale)} />
                ) : (
                    <div className="mt-4">
                        {steps.map((step, idx) => {
                            const text =
                                typeof step === "string"
                                    ? step
                                    : locale === "es"
                                    ? (step.es ?? step.step ?? step.en ?? "")
                                    : (step.en ?? step.step ?? step.es ?? "");
                            const isLast = idx === steps.length - 1;

                            return (
                                <div key={idx} className="flex gap-4">
                                    <div className="flex flex-col items-center shrink-0">
                                        <div
                                            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                                            style={{
                                                background: "rgba(57,255,20,0.1)",
                                                border: "1.5px solid rgba(57,255,20,0.4)",
                                                color: "#39ff14",
                                                boxShadow: "0 0 8px rgba(57,255,20,0.15)",
                                            }}
                                        >
                                            {idx + 1}
                                        </div>
                                        {!isLast && (
                                            <div
                                                className="w-px flex-1 mt-1"
                                                style={{
                                                    background:
                                                        "linear-gradient(to bottom, rgba(57,255,20,0.3), rgba(57,255,20,0.05))",
                                                    minHeight: "28px",
                                                }}
                                            />
                                        )}
                                    </div>

                                    <div className={`flex-1 ${isLast ? "pb-0" : "pb-4"}`}>
                                        <div
                                            className="p-4 rounded-xl text-sm leading-relaxed"
                                            style={{
                                                background: "#0d0d0d",
                                                border: "1px solid rgba(255,255,255,0.06)",
                                                color: "#f0f0f0",
                                            }}
                                        >
                                            {text}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ── Tips de ejecución ──────────────────────────────────────────── */}
            <section className="px-4 mt-8">
                <SectionHeader
                    icon={<Lightbulb className="w-5 h-5" />}
                    label={st("exercise.tips", locale)}
                />

                {tipsArray.length === 0 ? (
                    <EmptyState text={st("exercise.noTips", locale)} />
                ) : (
                    <div className="mt-4 space-y-2">
                        {tipsArray.map((tip, idx) => {
                            const text =
                                typeof tip === "string"
                                    ? tip
                                    : locale === "es"
                                    ? (tip.es ?? tip.tip ?? tip.en ?? "")
                                    : (tip.en ?? tip.tip ?? tip.es ?? "");
                            return <TipAccordion key={idx} text={text} index={idx} />;
                        })}
                    </div>
                )}
            </section>

            {/* ── Errores comunes y riesgos ──────────────────────────────────── */}
            <section className="px-4 mt-8">
                <SectionHeader
                    icon={
                        <AlertTriangle className="w-5 h-5" style={{ color: "#ef4444" }} />
                    }
                    label={st("exercise.risks", locale)}
                    labelColor="#f0f0f0"
                />

                {risks.length === 0 ? (
                    <EmptyState text={st("exercise.noRisks", locale)} />
                ) : (
                    <div className="mt-4 space-y-3">
                        {risks.map((risk, idx) => {
                            if (typeof risk === "string") {
                                return (
                                    <RiskCard
                                        key={idx}
                                        title={risk}
                                        description=""
                                        avoidLabel={st("exercise.avoidHow", locale)}
                                    />
                                );
                            }
                            const title =
                                locale === "es"
                                    ? (risk.title_es ?? risk.title ?? "")
                                    : (risk.title ?? "");
                            const description =
                                locale === "es"
                                    ? (risk.description_es ?? risk.description ?? "")
                                    : (risk.description ?? "");
                            const avoidText =
                                locale === "es"
                                    ? (risk.avoid_es ?? risk.avoid ?? "")
                                    : (risk.avoid ?? "");
                            return (
                                <RiskCard
                                    key={idx}
                                    title={title}
                                    description={description}
                                    avoidText={avoidText}
                                    avoidLabel={st("exercise.avoidHow", locale)}
                                />
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ── Video de apoyo ─────────────────────────────────────────────── */}
            <section className="px-4 mt-8">
                <a
                    href={resolvedYoutubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-4 rounded-xl font-semibold text-sm transition-all hover:opacity-80 active:scale-95"
                    style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1.5px solid rgba(220,38,38,0.5)",
                        color: "#f0f0f0",
                    }}
                >
                    <Youtube className="w-5 h-5" style={{ color: "#ef4444" }} />
                    {st("exercise.watchVideo", locale)}
                </a>
            </section>

            {/* ── Bottom padding for chat FAB ────────────────────────────────── */}
            <div style={{ height: "100px" }} />

            {/* ── AI Chat FAB (client component, lazy-loaded) ───────────────── */}
            <ExerciseChatFAB
                exerciseId={exercise.id}
                exerciseName={displayName}
            />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Sub-components (server-renderable, no 'use client' needed)
// ---------------------------------------------------------------------------

function SectionHeader({
    icon,
    label,
    labelColor = "#39ff14",
}: {
    icon: React.ReactNode;
    label: string;
    labelColor?: string;
}) {
    return (
        <div className="flex items-center gap-2.5">
            <span style={{ color: labelColor }}>{icon}</span>
            <h2 className="text-base font-bold" style={{ color: labelColor }}>
                {label}
            </h2>
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <p className="mt-3 text-sm" style={{ color: "#555" }}>
            {text}
        </p>
    );
}

/**
 * Tip accordion using native HTML <details>/<summary> — zero JS, keyboard accessible.
 * Formats tip text as "Title: body" → title in summary, body in content.
 */
function TipAccordion({ text, index }: { text: string; index: number }) {
    const colonIdx = text.indexOf(":");
    const hasTitle = colonIdx > 0 && colonIdx < 50;
    const title = hasTitle ? text.slice(0, colonIdx).trim() : `Tip ${index + 1}`;
    const body = hasTitle ? text.slice(colonIdx + 1).trim() : text;

    return (
        <details
            className="group rounded-xl overflow-hidden"
            style={{
                background: "#0d0d0d",
                border: "1px solid rgba(255,255,255,0.06)",
                borderLeft: "3px solid rgba(57,255,20,0.5)",
            }}
        >
            <summary
                className="flex items-center justify-between px-4 py-3.5 cursor-pointer select-none text-sm font-medium"
                style={{ color: "#f0f0f0", listStyle: "none" }}
            >
                <span>{title}</span>
                <ChevronDown
                    className="w-4 h-4 transition-transform group-open:rotate-180 shrink-0"
                    style={{ color: "#39ff14" }}
                />
            </summary>
            <div className="px-4 pb-4 text-sm leading-relaxed" style={{ color: "#888" }}>
                {body}
            </div>
        </details>
    );
}

function RiskCard({
    title,
    description,
    avoidText,
    avoidLabel,
}: {
    title: string;
    description: string;
    avoidText?: string;
    avoidLabel: string;
}) {
    return (
        <div
            className="p-4 rounded-xl"
            style={{
                background: "#0d0d0d",
                border: "1px solid rgba(255,255,255,0.06)",
                borderLeft: "3px solid rgba(239,68,68,0.6)",
            }}
        >
            <div className="flex items-start gap-2 mb-1">
                <AlertTriangle
                    className="w-3.5 h-3.5 mt-0.5 shrink-0"
                    style={{ color: "#ef4444" }}
                />
                <p className="text-sm font-semibold" style={{ color: "#f0f0f0" }}>
                    {title}
                </p>
            </div>
            {description && (
                <p
                    className="text-xs leading-relaxed mt-1.5"
                    style={{ color: "#888", paddingLeft: "1.375rem" }}
                >
                    {description}
                </p>
            )}
            {avoidText && (
                <div
                    className="mt-2 pt-2"
                    style={{
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                        paddingLeft: "1.375rem",
                    }}
                >
                    <p
                        className="text-[10px] uppercase tracking-widest font-bold mb-1"
                        style={{ color: "#ef4444" }}
                    >
                        {avoidLabel}
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "#888" }}>
                        {avoidText}
                    </p>
                </div>
            )}
        </div>
    );
}
