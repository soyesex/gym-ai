/**
 * @file components/skeletons/ExerciseCardSkeleton.tsx
 * Skeleton placeholder for exercise cards in the library grid.
 * Uses pulse animation with dark neon theme colors.
 */

export function ExerciseCardSkeleton() {
    return (
        <div
            className="rounded-2xl overflow-hidden animate-pulse"
            style={{
                background: "#0a0a0a",
                border: "1px solid rgba(255,255,255,0.06)",
            }}
        >
            {/* Image placeholder */}
            <div
                className="w-full h-32"
                style={{ background: "rgba(57,255,20,0.04)" }}
            />
            <div className="p-3 space-y-2">
                {/* Title */}
                <div
                    className="h-4 w-3/4 rounded"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                />
                {/* Subtitle */}
                <div
                    className="h-3 w-1/2 rounded"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                />
                {/* Badges row */}
                <div className="flex gap-2 pt-1">
                    <div
                        className="h-5 w-16 rounded-full"
                        style={{ background: "rgba(57,255,20,0.06)" }}
                    />
                    <div
                        className="h-5 w-14 rounded-full"
                        style={{ background: "rgba(57,255,20,0.06)" }}
                    />
                </div>
            </div>
        </div>
    );
}

/** Renders a grid of skeleton cards */
export function ExerciseGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 gap-3 px-5">
            {Array.from({ length: count }).map((_, i) => (
                <ExerciseCardSkeleton key={i} />
            ))}
        </div>
    );
}
