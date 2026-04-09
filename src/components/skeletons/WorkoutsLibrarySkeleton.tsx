/**
 * @file components/skeletons/WorkoutsLibrarySkeleton.tsx
 * Skeleton placeholder for the /workouts Exercise Library page.
 * Mimics: header + search bar + category pills + exercise card grid.
 */
import LoadingStateMessage from "@/components/ui/LoadingStateMessage";

export function WorkoutsLibrarySkeleton() {
    return (
        <div
            className="min-h-screen pb-24 animate-pulse"
            style={{ background: "#000", maxWidth: 480, margin: "0 auto" }}
        >
            {/* Header */}
            <div className="px-5 pt-12 pb-2">
                <div className="flex items-center gap-2 mb-1">
                    <div
                        className="w-5 h-5 rounded"
                        style={{ background: "rgba(57,255,20,0.08)" }}
                    />
                    <div
                        className="h-3 w-20 rounded"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                    />
                </div>
                <div
                    className="h-6 w-32 rounded mb-4"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                />

                {/* Search bar */}
                <div
                    className="h-12 w-full rounded-xl mb-4"
                    style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                    }}
                />
            </div>

            {/* Category pills */}
            <div className="px-5 pb-4">
                <div className="flex gap-2">
                    {[80, 64, 72, 56].map((w, i) => (
                        <div
                            key={i}
                            className="h-8 rounded-full"
                            style={{
                                width: w,
                                background: i === 0 ? "rgba(57,255,20,0.12)" : "rgba(255,255,255,0.04)",
                                border: i === 0
                                    ? "1px solid rgba(57,255,20,0.3)"
                                    : "1px solid rgba(255,255,255,0.08)",
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Exercise grid — 2 columns × 3 rows */}
            <div className="px-5">
                <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="aspect-[3/4] rounded-xl overflow-hidden"
                            style={{
                                background: "#0a0a0a",
                                border: "1px solid rgba(255,255,255,0.06)",
                            }}
                        >
                            <div
                                className="w-full h-2/3"
                                style={{ background: "rgba(57,255,20,0.03)" }}
                            />
                            <div className="p-3 space-y-2">
                                <div
                                    className="h-3 w-3/4 rounded"
                                    style={{ background: "rgba(255,255,255,0.06)" }}
                                />
                                <div
                                    className="h-3 w-1/2 rounded"
                                    style={{ background: "rgba(255,255,255,0.04)" }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <LoadingStateMessage />
        </div>
    );
}
