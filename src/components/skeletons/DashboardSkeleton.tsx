/**
 * @file components/skeletons/DashboardSkeleton.tsx
 * Skeleton placeholder for the home dashboard.
 * Mimics: welcome header + stats cards + recommended module cards.
 */
import LoadingStateMessage from "@/components/ui/LoadingStateMessage";

export function DashboardSkeleton() {
    return (
        <div className="min-h-screen px-5 pt-12 pb-24 animate-pulse" style={{ maxWidth: 480, margin: "0 auto" }}>
            {/* Welcome header */}
            <div className="mb-6">
                <div
                    className="h-3 w-24 rounded mb-2"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                />
                <div
                    className="h-6 w-48 rounded"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-8">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="rounded-2xl p-4"
                        style={{
                            background: "#0a0a0a",
                            border: "1px solid rgba(255,255,255,0.06)",
                        }}
                    >
                        <div
                            className="h-8 w-12 rounded mb-2"
                            style={{ background: "rgba(57,255,20,0.08)" }}
                        />
                        <div
                            className="h-3 w-16 rounded"
                            style={{ background: "rgba(255,255,255,0.04)" }}
                        />
                    </div>
                ))}
            </div>

            {/* Section header */}
            <div
                className="h-4 w-40 rounded mb-4"
                style={{ background: "rgba(255,255,255,0.06)" }}
            />

            {/* Module cards */}
            <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="rounded-2xl overflow-hidden"
                        style={{
                            background: "#0a0a0a",
                            border: "1px solid rgba(255,255,255,0.06)",
                        }}
                    >
                        <div
                            className="h-28 w-full"
                            style={{ background: "rgba(57,255,20,0.03)" }}
                        />
                        <div className="p-4 space-y-2">
                            <div
                                className="h-4 w-3/4 rounded"
                                style={{ background: "rgba(255,255,255,0.06)" }}
                            />
                            <div className="flex gap-2">
                                <div
                                    className="h-5 w-20 rounded-full"
                                    style={{ background: "rgba(57,255,20,0.06)" }}
                                />
                                <div
                                    className="h-5 w-16 rounded-full"
                                    style={{ background: "rgba(57,255,20,0.06)" }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <LoadingStateMessage />
        </div>
    );
}

