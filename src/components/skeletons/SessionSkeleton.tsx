/**
 * @file components/skeletons/SessionSkeleton.tsx
 * Skeleton placeholder for the /session/[id] workout session page.
 * Mimics: timer + exercise blocks with set rows + action buttons.
 */
import LoadingStateMessage from "@/components/ui/LoadingStateMessage";

export function SessionSkeleton() {
    return (
        <div
            className="min-h-screen pb-24 animate-pulse"
            style={{ background: "#000", maxWidth: 480, margin: "0 auto" }}
        >
            {/* Header */}
            <div className="px-5 pt-12 pb-2">
                <div className="flex items-center gap-2 mb-2">
                    <div
                        className="w-8 h-8 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                    />
                    <div
                        className="h-3 w-24 rounded"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                    />
                </div>
                <div
                    className="h-6 w-48 rounded"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                />
            </div>

            {/* Timer bar */}
            <div className="px-5 py-3">
                <div
                    className="h-14 w-full rounded-2xl"
                    style={{
                        background: "#0a0a0a",
                        border: "1px solid rgba(57,255,20,0.1)",
                    }}
                />
            </div>

            {/* Exercise blocks */}
            {[0, 1, 2].map((i) => (
                <div key={i} className="px-5 mb-4">
                    <div
                        className="rounded-2xl p-4"
                        style={{
                            background: "#0a0a0a",
                            border: "1px solid rgba(255,255,255,0.06)",
                        }}
                    >
                        {/* Exercise name */}
                        <div
                            className="h-5 w-40 rounded mb-4"
                            style={{ background: "rgba(255,255,255,0.08)" }}
                        />
                        {/* Set header */}
                        <div className="flex gap-6 mb-2">
                            <div
                                className="h-3 w-8 rounded"
                                style={{ background: "rgba(57,255,20,0.08)" }}
                            />
                            <div
                                className="h-3 w-8 rounded"
                                style={{ background: "rgba(57,255,20,0.08)" }}
                            />
                            <div
                                className="h-3 w-8 rounded"
                                style={{ background: "rgba(57,255,20,0.08)" }}
                            />
                        </div>
                        {/* Set rows */}
                        {[0, 1, 2].map((j) => (
                            <div key={j} className="flex gap-6 mb-2">
                                <div
                                    className="h-9 w-10 rounded-lg"
                                    style={{ background: "rgba(255,255,255,0.04)" }}
                                />
                                <div
                                    className="h-9 w-16 rounded-lg"
                                    style={{ background: "rgba(255,255,255,0.04)" }}
                                />
                                <div
                                    className="h-9 w-16 rounded-lg"
                                    style={{ background: "rgba(255,255,255,0.04)" }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Action buttons placeholder */}
            <div className="px-5 flex gap-3">
                <div
                    className="h-12 flex-1 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                />
                <div
                    className="h-12 flex-1 rounded-2xl"
                    style={{ background: "rgba(57,255,20,0.08)" }}
                />
            </div>

            <LoadingStateMessage />
        </div>
    );
}
