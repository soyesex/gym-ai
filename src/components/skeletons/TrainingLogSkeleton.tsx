/**
 * @file components/skeletons/TrainingLogSkeleton.tsx
 * Skeleton placeholder for the /log Training Log page.
 * Mimics: header + "Start Workout" button + workout session cards.
 */
import LoadingStateMessage from "@/components/ui/LoadingStateMessage";

export function TrainingLogSkeleton() {
    return (
        <div
            className="min-h-screen pb-24 animate-pulse"
            style={{ background: "#000", maxWidth: 480, margin: "0 auto" }}
        >
            {/* Header row */}
            <div className="px-5 pt-12 pb-4 flex items-center justify-between">
                <div>
                    <div
                        className="h-3 w-24 rounded mb-1"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                    />
                    <div
                        className="h-6 w-28 rounded"
                        style={{ background: "rgba(255,255,255,0.08)" }}
                    />
                </div>
                <div
                    className="h-10 w-36 rounded-2xl"
                    style={{ background: "rgba(57,255,20,0.12)" }}
                />
            </div>

            {/* Session cards */}
            <div className="px-5 space-y-3">
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="rounded-2xl p-4"
                        style={{
                            background: "#0a0a0a",
                            border: "1px solid rgba(255,255,255,0.06)",
                        }}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div
                                className="h-4 w-40 rounded"
                                style={{ background: "rgba(255,255,255,0.08)" }}
                            />
                            <div
                                className="h-5 w-20 rounded-full"
                                style={{ background: "rgba(57,255,20,0.08)" }}
                            />
                        </div>
                        <div className="flex gap-4">
                            <div
                                className="h-3 w-14 rounded"
                                style={{ background: "rgba(255,255,255,0.04)" }}
                            />
                            <div
                                className="h-3 w-20 rounded"
                                style={{ background: "rgba(255,255,255,0.04)" }}
                            />
                            <div
                                className="h-3 w-16 rounded"
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
