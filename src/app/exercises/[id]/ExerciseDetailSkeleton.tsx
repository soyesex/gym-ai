"use client";

/**
 * @file app/exercises/[id]/ExerciseDetailSkeleton.tsx
 * Pulse-animation skeleton for the exercise detail page.
 *
 * Matches the visual layout of the detail page so there is no jarring
 * layout shift once data loads. Uses #1a1a1a rectangles with a
 * CSS shimmer animation — no external dependencies.
 */

export default function ExerciseDetailSkeleton() {
    return (
        <div className="min-h-screen" style={{ background: "#000", maxWidth: "480px", margin: "0 auto" }}>
            {/* ── Header skeleton ──────────────────────────────────────── */}
            <div
                className="sticky top-0 z-50 flex items-center justify-between px-4 py-3"
                style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
                <SkeletonRect width={60} height={20} rounded={6} />
                <SkeletonRect width={80} height={18} rounded={6} />
                <SkeletonRect width={48} height={28} rounded={20} />
            </div>

            {/* ── Hero image skeleton ───────────────────────────────────── */}
            <div className="relative mx-4 mt-4" style={{ aspectRatio: "16/9", borderRadius: "16px", overflow: "hidden" }}>
                <SkeletonBlock className="absolute inset-0" />
                {/* Badge placeholders over gradient bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)" }}>
                    <div className="flex gap-2 mb-2">
                        <SkeletonRect width={60} height={20} rounded={6} />
                        <SkeletonRect width={80} height={20} rounded={6} />
                    </div>
                    <SkeletonRect width={220} height={28} rounded={6} />
                    <div className="mt-2">
                        <SkeletonRect width={140} height={16} rounded={4} />
                    </div>
                </div>
            </div>

            {/* ── "Cómo hacerlo" skeleton ───────────────────────────────── */}
            <div className="px-4 mt-6">
                <div className="flex items-center gap-2 mb-4">
                    <SkeletonRect width={20} height={20} rounded={4} />
                    <SkeletonRect width={140} height={22} rounded={6} />
                </div>
                {/* Step cards */}
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 mb-4">
                        <div className="flex flex-col items-center">
                            <SkeletonRect width={36} height={36} rounded={18} />
                            {i < 3 && <div className="w-0.5 flex-1 mt-2" style={{ minHeight: 32, background: "rgba(57,255,20,0.08)" }} />}
                        </div>
                        <div className="flex-1 pb-2">
                            <SkeletonBlock
                                className="w-full"
                                style={{ height: i === 2 ? 72 : 56, borderRadius: 12 }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Tips accordion skeleton ────────────────────────────────── */}
            <div className="px-4 mt-6">
                <div className="flex items-center gap-2 mb-4">
                    <SkeletonRect width={20} height={20} rounded={4} />
                    <SkeletonRect width={160} height={22} rounded={6} />
                </div>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="mb-2" style={{ borderRadius: 12, overflow: "hidden" }}>
                        <SkeletonBlock style={{ height: 52 }} />
                    </div>
                ))}
            </div>

            {/* ── Risks cards skeleton ───────────────────────────────────── */}
            <div className="px-4 mt-6">
                <div className="flex items-center gap-2 mb-4">
                    <SkeletonRect width={20} height={20} rounded={4} />
                    <SkeletonRect width={200} height={22} rounded={6} />
                </div>
                {[1, 2].map((i) => (
                    <div key={i} className="mb-3" style={{ borderRadius: 12, overflow: "hidden" }}>
                        <SkeletonBlock style={{ height: 80 }} />
                    </div>
                ))}
            </div>

            {/* ── YouTube button skeleton ───────────────────────────────── */}
            <div className="px-4 mt-6 mb-28">
                <SkeletonBlock style={{ height: 56, borderRadius: 16 }} />
            </div>
        </div>
    );
}

// ── Skeleton primitives ──────────────────────────────────────────────────────

function SkeletonBlock({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
    return (
        <div
            className={`skeleton-pulse ${className}`}
            style={{
                background: "#1a1a1a",
                ...style,
            }}
        />
    );
}

function SkeletonRect({
    width,
    height,
    rounded = 8,
}: {
    width: number | string;
    height: number;
    rounded?: number;
}) {
    return (
        <div
            className="skeleton-pulse shrink-0"
            style={{
                width,
                height,
                borderRadius: rounded,
                background: "#1a1a1a",
            }}
        />
    );
}

// Import React for CSSProperties type usage in sub-components
import type React from "react";
