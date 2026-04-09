/**
 * @file components/skeletons/StatsSkeleton.tsx
 * Skeleton placeholder for the /stats page.
 * Mimics: header + stat cards + chart area + recent sessions list.
 */
import LoadingStateMessage from "@/components/ui/LoadingStateMessage";

export function StatsSkeleton() {
    return (
        <div
            className="min-h-screen pb-24 animate-pulse"
            style={{ background: "#000", maxWidth: 480, margin: "0 auto" }}
        >
            {/* Header */}
            <div className="px-5 pt-12 pb-2">
                <div
                    className="h-3 w-16 rounded mb-2"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                />
                <div
                    className="h-6 w-28 rounded"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                />
            </div>

            {/* Stat cards — 2×2 grid */}
            <div className="px-5 py-4">
                <div className="grid grid-cols-2 gap-3">
                    {[
                        "rgba(57,255,20,0.06)",
                        "rgba(96,165,250,0.06)",
                        "rgba(245,158,11,0.06)",
                        "rgba(249,115,22,0.06)",
                    ].map((bg, i) => (
                        <div
                            key={i}
                            className="rounded-2xl p-4"
                            style={{
                                background: "#0a0a0a",
                                border: "1px solid rgba(255,255,255,0.06)",
                            }}
                        >
                            <div
                                className="w-8 h-8 rounded-xl mb-3"
                                style={{ background: bg }}
                            />
                            <div
                                className="h-6 w-16 rounded mb-1"
                                style={{ background: "rgba(255,255,255,0.08)" }}
                            />
                            <div
                                className="h-3 w-20 rounded"
                                style={{ background: "rgba(255,255,255,0.04)" }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Chart placeholder */}
            <div className="px-5 mb-4">
                <div
                    className="h-48 w-full rounded-2xl"
                    style={{
                        background: "#0a0a0a",
                        border: "1px solid rgba(255,255,255,0.06)",
                    }}
                />
            </div>

            {/* Recent sessions list */}
            <div className="px-5">
                <div
                    className="h-4 w-32 rounded mb-3"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                />
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="rounded-2xl p-4 mb-3"
                        style={{
                            background: "#0a0a0a",
                            border: "1px solid rgba(255,255,255,0.06)",
                        }}
                    >
                        <div
                            className="h-4 w-48 rounded mb-2"
                            style={{ background: "rgba(255,255,255,0.06)" }}
                        />
                        <div className="flex gap-4">
                            <div
                                className="h-3 w-16 rounded"
                                style={{ background: "rgba(255,255,255,0.04)" }}
                            />
                            <div
                                className="h-3 w-12 rounded"
                                style={{ background: "rgba(255,255,255,0.04)" }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <LoadingStateMessage />
        </div>
    );
}
