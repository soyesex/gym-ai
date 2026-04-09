/**
 * @file components/skeletons/ProfileSkeleton.tsx
 * Skeleton placeholder for the /profile page.
 * Mimics: avatar + name + email + settings sections.
 */
import LoadingStateMessage from "@/components/ui/LoadingStateMessage";

export function ProfileSkeleton() {
    return (
        <div
            className="min-h-screen pb-24 animate-pulse"
            style={{ background: "#000", maxWidth: 480, margin: "0 auto" }}
        >
            {/* Header */}
            <div className="px-5 pt-12 pb-6">
                <div
                    className="h-3 w-20 rounded mb-2"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                />
                <div
                    className="h-6 w-32 rounded"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                />
            </div>

            {/* Avatar + name card */}
            <div className="px-5 mb-6">
                <div
                    className="rounded-2xl p-6 flex flex-col items-center"
                    style={{
                        background: "#0a0a0a",
                        border: "1px solid rgba(255,255,255,0.06)",
                    }}
                >
                    <div
                        className="w-20 h-20 rounded-full mb-4"
                        style={{ background: "rgba(57,255,20,0.08)" }}
                    />
                    <div
                        className="h-5 w-36 rounded mb-2"
                        style={{ background: "rgba(255,255,255,0.08)" }}
                    />
                    <div
                        className="h-3 w-48 rounded"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                    />
                </div>
            </div>

            {/* Settings sections */}
            {[0, 1, 2].map((i) => (
                <div key={i} className="px-5 mb-4">
                    <div
                        className="h-3 w-24 rounded mb-3"
                        style={{ background: "rgba(57,255,20,0.08)" }}
                    />
                    <div
                        className="rounded-2xl p-4 space-y-3"
                        style={{
                            background: "#0a0a0a",
                            border: "1px solid rgba(255,255,255,0.06)",
                        }}
                    >
                        <div
                            className="h-4 w-full rounded"
                            style={{ background: "rgba(255,255,255,0.04)" }}
                        />
                        <div
                            className="h-4 w-3/4 rounded"
                            style={{ background: "rgba(255,255,255,0.04)" }}
                        />
                    </div>
                </div>
            ))}

            <LoadingStateMessage />
        </div>
    );
}
