"use client";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    Tooltip,
    CartesianGrid,
    Dot,
} from "recharts";
import { useTranslation } from "@/i18n";
import type { WeeklySessionPoint, WeeklyVolumePoint, DurationPoint } from "./StatsClient";

// Shared tooltip style matching the dark app palette
const TOOLTIP_STYLE = {
    background: "#1a1a1a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "0.5rem",
    color: "#fff",
    fontSize: 12,
};

const CURSOR_STYLE = { fill: "rgba(255,255,255,0.04)" };

const AXIS_TICK = { fontSize: 10, fill: "rgba(255,255,255,0.3)" };

function ChartSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mb-6">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-3 px-5">{title}</p>
            <div
                className="mx-5 rounded-2xl py-4 px-2"
                style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.06)" }}
            >
                {children}
            </div>
        </div>
    );
}

interface StatsChartsProps {
    weeklySessionsData: WeeklySessionPoint[];
    weeklyVolumeData: WeeklyVolumePoint[];
    sessionDurationData: DurationPoint[];
}

export default function StatsCharts({
    weeklySessionsData,
    weeklyVolumeData,
    sessionDurationData,
}: StatsChartsProps) {
    const { t, locale } = useTranslation();

    const hasVolume = weeklyVolumeData.some((d) => d.volumeKg > 0);
    const hasDuration = sessionDurationData.length >= 2;

    // Format ISO date as short label client-side (locale-aware)
    function shortDate(iso: string | null): string {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString(
            locale === "es" ? "es-ES" : "en-US",
            { month: "short", day: "numeric" }
        );
    }

    const durationChartData = sessionDurationData.map((d) => ({
        label: shortDate(d.startedAt),
        minutes: d.minutes,
    }));

    return (
        <>
            {/* Chart 1: Sessions per week */}
            <ChartSection title={t("stats.sessionsPerWeek")}>
                <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={weeklySessionsData} barCategoryGap="30%">
                        <XAxis dataKey="week" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                        <Tooltip
                            contentStyle={TOOLTIP_STYLE}
                            cursor={CURSOR_STYLE}
                            formatter={(v) => [v, t("stats.sessions")]}
                        />
                        <Bar dataKey="count" fill="#39ff14" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartSection>

            {/* Chart 2: Weekly volume */}
            <ChartSection title={t("stats.weeklyVolume")}>
                {hasVolume ? (
                    <ResponsiveContainer width="100%" height={140}>
                        <LineChart data={weeklyVolumeData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="week" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                cursor={{ stroke: "rgba(255,255,255,0.1)" }}
                                formatter={(v) => [`${Number(v).toLocaleString()} kg`, t("stats.weeklyVolume")]}
                            />
                            <Line
                                type="monotone"
                                dataKey="volumeKg"
                                stroke="#60a5fa"
                                strokeWidth={2}
                                dot={<Dot r={3} fill="#60a5fa" stroke="#60a5fa" />}
                                activeDot={{ r: 5, fill: "#60a5fa" }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-xs text-white/25 text-center py-10 px-4">
                        {t("stats.noVolumeData")}
                    </p>
                )}
            </ChartSection>

            {/* Chart 3: Session duration */}
            {hasDuration && (
                <ChartSection title={t("stats.sessionDuration")}>
                    <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={durationChartData} barCategoryGap="25%">
                            <XAxis
                                dataKey="label"
                                tick={{ ...AXIS_TICK, textAnchor: "end" }}
                                axisLine={false}
                                tickLine={false}
                                angle={-35}
                                height={36}
                            />
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                cursor={CURSOR_STYLE}
                                formatter={(v) => [`${v} min`, t("stats.sessionDuration")]}
                            />
                            <Bar dataKey="minutes" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartSection>
            )}
        </>
    );
}
