"use client";

/**
 * @file app/workouts/new/page.tsx
 * "Start Workout" page — a simple form: name the session, tap Start.
 * Calls createWorkout() Server Action and redirects to the active session.
 */
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Dumbbell, Loader2 } from "lucide-react";
import { createWorkout } from "@/app/workouts/actions";
import { useTranslation } from "@/i18n";
import BottomNav from "@/components/home/BottomNav";

// Quick-pick keys — mapped to i18n keys under "newWorkout.*"
const QUICK_PICK_KEYS = [
    "newWorkout.pushDay",
    "newWorkout.pullDay",
    "newWorkout.legDay",
    "newWorkout.upperBody",
    "newWorkout.fullBody",
    "newWorkout.cardio",
] as const;

export default function NewWorkoutPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const trimmed = name.trim();

    // Translated quick-pick names
    const quickNames = useMemo(
        () => QUICK_PICK_KEYS.map((key) => t(key)),
        [t],
    );

    async function handleStart() {
        if (!trimmed) return;
        setLoading(true);
        setError(null);

        const result = await createWorkout(trimmed);

        if (!result.success) {
            setError(result.message);
            setLoading(false);
            return;
        }

        // Navigate to the active session immediately
        router.push(`/session/${result.data.id}`);
    }

    return (
        <main
            className="min-h-screen pb-24"
            style={{ background: "#000", maxWidth: "480px", margin: "0 auto" }}
        >
            {/* Header */}
            <div className="px-5 pt-12 pb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> {t("newWorkout.back")}
                </button>

                <Dumbbell
                    className="w-10 h-10 mb-4"
                    style={{ color: "#39ff14", filter: "drop-shadow(0 0 8px rgba(57,255,20,0.5))" }}
                />
                <h1 className="text-2xl font-bold text-white mb-1">{t("newWorkout.title")}</h1>
                <p className="text-sm text-white/40">
                    {t("newWorkout.subtitle")}
                </p>
            </div>

            {/* Form */}
            <div className="px-5 space-y-6">
                {/* Name input */}
                <div>
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-3">
                        {t("newWorkout.nameLabel")}
                    </p>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("newWorkout.namePlaceholder")}
                        onKeyDown={(e) => e.key === "Enter" && handleStart()}
                        className="w-full text-white text-base outline-none rounded-2xl px-4 py-4 placeholder:text-white/20"
                        style={{
                            background: "rgba(255,255,255,0.04)",
                            border: `1px solid ${trimmed ? "#39ff14" : "rgba(255,255,255,0.08)"}`,
                            transition: "border-color 0.2s",
                        }}
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus
                    />
                </div>

                {/* Quick-pick pills */}
                <div>
                    <p className="text-xs text-white/25 uppercase tracking-widest mb-3">
                        {t("newWorkout.quickPick")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {quickNames.map((n) => (
                            <button
                                key={n}
                                onClick={() => setName(n)}
                                className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                                style={{
                                    background: name === n
                                        ? "rgba(57,255,20,0.12)"
                                        : "rgba(255,255,255,0.04)",
                                    border: `1px solid ${name === n ? "#39ff14" : "rgba(255,255,255,0.07)"}`,
                                    color: name === n ? "#39ff14" : "rgba(255,255,255,0.5)",
                                }}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <p
                        className="text-xs text-red-400 px-3 py-2 rounded-xl"
                        style={{ background: "rgba(255,50,50,0.08)" }}
                    >
                        {error}
                    </p>
                )}

                {/* CTA */}
                <button
                    onClick={handleStart}
                    disabled={!trimmed || loading}
                    className="w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200"
                    style={{
                        background: trimmed ? "#39ff14" : "rgba(57,255,20,0.08)",
                        color: trimmed ? "#000" : "rgba(57,255,20,0.3)",
                        cursor: trimmed ? "pointer" : "not-allowed",
                    }}
                >
                    {loading
                        ? <Loader2 className="w-5 h-5 animate-spin" />
                        : t("newWorkout.start")}
                </button>
            </div>

            <BottomNav />
        </main>
    );
}
