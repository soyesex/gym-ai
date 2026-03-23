/**
 * @file components/skeletons/WorkoutDetailSkeleton.tsx
 * Skeleton placeholder for the workout session / detail view.
 * Mimics: header + exercise list with sets.
 */

export function WorkoutDetailSkeleton() {
    return (
        <div className="min-h-screen px-5 pt-12 pb-24 animate-pulse" style={{ maxWidth: 480, margin: "0 auto" }}>
            {/* Header */}
            <div className="mb-6">
                <div
                    className="h-3 w-20 rounded mb-2"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                />
                <div
                    className="h-6 w-56 rounded"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                />
            </div>

            {/* Timer placeholder */}
            <div
                className="h-14 w-full rounded-2xl mb-6"
                style={{
                    background: "#0a0a0a",
                    border: "1px solid rgba(255,255,255,0.06)",
                }}
            />

            {/* Exercise blocks */}
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="rounded-2xl mb-4 p-4"
                    style={{
                        background: "#0a0a0a",
                        border: "1px solid rgba(255,255,255,0.06)",
                    }}
                >
                    {/* Exercise name */}
                    <div
                        className="h-5 w-40 rounded mb-3"
                        style={{ background: "rgba(255,255,255,0.08)" }}
                    />
                    {/* Sets table header */}
                    <div className="flex gap-4 mb-2">
                        <div
                            className="h-3 w-10 rounded"
                            style={{ background: "rgba(57,255,20,0.06)" }}
                        />
                        <div
                            className="h-3 w-10 rounded"
                            style={{ background: "rgba(57,255,20,0.06)" }}
                        />
                        <div
                            className="h-3 w-10 rounded"
                            style={{ background: "rgba(57,255,20,0.06)" }}
                        />
                    </div>
                    {/* Set rows */}
                    {[0, 1, 2].map((j) => (
                        <div key={j} className="flex gap-4 mb-2">
                            <div
                                className="h-8 w-12 rounded"
                                style={{ background: "rgba(255,255,255,0.04)" }}
                            />
                            <div
                                className="h-8 w-16 rounded"
                                style={{ background: "rgba(255,255,255,0.04)" }}
                            />
                            <div
                                className="h-8 w-16 rounded"
                                style={{ background: "rgba(255,255,255,0.04)" }}
                            />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
