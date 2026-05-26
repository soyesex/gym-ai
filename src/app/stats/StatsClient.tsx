"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { BarChart2, Clock3, Zap, CheckCircle2, Flame, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import BottomNav from "@/components/home/BottomNav";
import { useTranslation } from "@/i18n";

const StatsCharts = dynamic(() => import("./StatsCharts"), { ssr: false });

// Icon map

/**
 * Maps string identifiers from the server to actual Lucide components.
 * React components can't be serialized across the RSC → Client boundary,
 * so the server passes an `iconId` string and we resolve it here.
 */
const ICON_MAP: Record<string, LucideIcon> = {
    CheckCircle2,
    Clock3,
    Zap,
    Flame,
};

// Types

/** Pre-computed stat card data passed from the server */
interface StatCard {
    /** String key that maps to a Lucide icon via ICON_MAP */
    iconId: string;
    /** Translation key inside the `stats` namespace (e.g. "sessions") */
    labelKey: string;
    value: string;
    color: string;
}

// Chart data point types — exported for use in page.tsx
export type WeeklySessionPoint = { week: string; count: number };
export type WeeklyVolumePoint  = { week: string; volumeKg: number };
export type DurationPoint      = { startedAt: string | null; minutes: number };

export interface StatsClientProps {
    stats: StatCard[];
    longestSession: {
        id: string;
        name: string;
        name_es?: string | null;
        startedAt: string | null;
        durationFormatted: string;
    } | null;
    recentSessions: {
        id: string;
        name: string;
        name_es?: string | null;
        startedAt: string | null;
        durationFormatted: string;
        difficulty: number | null;
        status: "active" | "completed";
        colorIdx: number;
    }[];
    hasCompletedSessions: boolean;
    hasAnySessions: boolean;
    weeklySessionsData: WeeklySessionPoint[];
    weeklyVolumeData: WeeklyVolumePoint[];
    sessionDurationData: DurationPoint[];
}

/** Color themes for dual active sessions */
const SESSION_COLORS = [
    { accent: "#39ff14", bg: "rgba(57,255,20,0.03)", border: "rgba(57,255,20,0.25)" },
    { accent: "#00d4ff", bg: "rgba(0,212,255,0.03)", border: "rgba(0,212,255,0.25)" },
];

// -- Helpers -----------------------------------------------------------------

/** Formats an ISO date to a short locale-aware label */
function formatDate(iso: string | null, locale: string): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(
        locale === "es" ? "es-ES" : "en-US",
        { month: "short", day: "numeric" }
    );
}

// -- Component ---------------------------------------------------------------

export default function StatsClient({
    stats,
    longestSession,
    recentSessions,
    hasCompletedSessions,
    hasAnySessions,
    weeklySessionsData,
    weeklyVolumeData,
    sessionDurationData,
}: StatsClientProps) {
    const { t, locale } = useTranslation();

    return (
        <main
            className="min-h-screen pb-24"
            style={{ background: "#000", maxWidth: "480px", margin: "0 auto" }}
        >
            {/* Header */}
            <div className="px-5 pt-12 pb-6">
                <p className="text-xs tracking-[0.3em] text-white/30 uppercase mb-0.5">
                    {t("stats.performance")}
                </p>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <BarChart2 className="w-6 h-6" style={{ color: "#39ff14" }} />
                    {t("stats.stats")}
                </h1>
            </div>

            {/* Stats grid */}
            <div className="px-5 grid grid-cols-2 gap-3 mb-6">
                {stats.map(({ iconId, labelKey, value, color }) => {
                    const Icon = ICON_MAP[iconId] ?? BarChart2;
                    return (
                        <div
                            key={labelKey}
                            className="rounded-2xl p-4"
                            style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                            <Icon className="w-5 h-5 mb-3" style={{ color }} />
                            <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
                            <p className="text-xs text-white/35 mt-0.5">{t(`stats.${labelKey}`)}</p>
                        </div>
                    );
                })}
            </div>

            {/* Progress charts */}
            {hasCompletedSessions && (
                <StatsCharts
                    weeklySessionsData={weeklySessionsData}
                    weeklyVolumeData={weeklyVolumeData}
                    sessionDurationData={sessionDurationData}
                />
            )}

            {/* Best session */}
            {longestSession && (
                <div className="px-5 mb-6">
                    <p className="text-xs text-white/30 uppercase tracking-widest mb-3">
                        {t("stats.personalBest")}
                    </p>
                    <Link
                        href={`/session/${longestSession.id}`}
                        className="block rounded-2xl p-4 transition-all hover:brightness-105"
                        style={{ background: "#0a0a0a", border: "1px solid rgba(57,255,20,0.15)" }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-white">
                                    {locale === "es" && longestSession.name_es ? longestSession.name_es : longestSession.name}
                                </p>
                                <p className="text-xs text-white/35 mt-0.5">
                                    {formatDate(longestSession.startedAt, locale)} · {longestSession.durationFormatted}
                                </p>
                            </div>
                            <TrendingUp className="w-5 h-5" style={{ color: "#39ff14" }} />
                        </div>
                    </Link>
                </div>
            )}

            {/* Recent sessions */}
            {hasAnySessions && (
                <div className="px-5">
                    <p className="text-xs text-white/30 uppercase tracking-widest mb-3">
                        {t("stats.recentSessions")}
                    </p>
                    <div className="space-y-2">
                        {recentSessions.map((w) => {
                            const colors = w.status === "active" && w.colorIdx >= 0
                                ? SESSION_COLORS[w.colorIdx] ?? SESSION_COLORS[0]
                                : null;
                            return (
                            <Link
                                key={w.id}
                                href={`/session/${w.id}`}
                                className="flex items-center justify-between px-4 py-3 rounded-xl transition-all hover:bg-white/5"
                                style={{
                                    border: colors
                                        ? `1.5px solid ${colors.border}`
                                        : "1px solid rgba(255,255,255,0.05)",
                                    background: colors ? colors.bg : "#0a0a0a",
                                }}
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-white truncate max-w-[180px]">
                                            {locale === "es" && w.name_es ? w.name_es : w.name}
                                        </p>
                                        {w.status === "active" && (
                                            <span
                                                className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md flex items-center gap-1"
                                                style={{ background: `${(colors?.accent ?? "#39ff14")}20`, color: colors?.accent ?? "#39ff14" }}
                                            >
                                                <span
                                                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                                                    style={{ background: colors?.accent ?? "#39ff14" }}
                                                />
                                                {t("log.active")}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-white/30 mt-0.5">{formatDate(w.startedAt, locale)}</p>
                                </div>
                                <div className="text-right">
                                    {w.status === "completed" && (
                                        <p className="text-sm font-bold text-white tabular-nums">
                                            {w.durationFormatted}
                                        </p>
                                    )}
                                    {w.status === "completed" && w.difficulty != null && (
                                        <p className="text-xs text-white/30 mt-0.5">
                                            RPE {w.difficulty}
                                        </p>
                                    )}
                                    {w.status === "active" && (
                                        <p className="text-xs font-medium" style={{ color: colors?.accent ?? "#39ff14" }}>
                                            {t("home.resume")} →
                                        </p>
                                    )}
                                </div>
                            </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!hasCompletedSessions && (
                <div className="px-5">
                    <div
                        className="rounded-2xl py-14 flex flex-col items-center gap-3 text-center"
                        style={{ border: "1px dashed rgba(255,255,255,0.08)" }}
                    >
                        <BarChart2 className="w-10 h-10" style={{ color: "rgba(57,255,20,0.25)" }} />
                        <p className="text-sm text-white/40">{t("stats.noSessionsYet")}</p>
                        <Link
                            href="/workouts/new"
                            className="text-xs font-semibold px-4 py-2 rounded-xl"
                            style={{ background: "rgba(57,255,20,0.08)", color: "#39ff14" }}
                        >
                            {t("stats.startFirstWorkout")}
                        </Link>
                    </div>
                </div>
            )}

            <BottomNav />
        </main>
    );
}
