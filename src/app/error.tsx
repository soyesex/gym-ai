"use client";

/**
 * @file app/error.tsx
 * Global error boundary — catches unhandled errors in route segments.
 *
 * Security: NEVER exposes stack traces, technical messages, or Supabase/Gemini
 * internals to the user. Only console.error for debugging.
 *
 * Design: Dark neon theme. Shows generic "Something went wrong" + Retry button.
 */

import { useEffect } from "react";
import { useTranslation } from "@/i18n";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
    const { t } = useTranslation();

    useEffect(() => {
        // Log for debugging — includes digest for Vercel error tracking
        console.error("[ErrorBoundary] Unhandled error:", {
            message: error.message,
            digest: error.digest,
        });
    }, [error]);

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-black">
            {/* Icon */}
            <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                style={{
                    background: "rgba(57,255,20,0.08)",
                    border: "1px solid rgba(57,255,20,0.2)",
                }}
            >
                <AlertTriangle
                    className="w-8 h-8"
                    style={{ color: "#39ff14" }}
                />
            </div>

            {/* Message */}
            <h1 className="text-2xl font-bold text-white mb-2">
                {t("error.generic")}
            </h1>
            <p className="text-sm text-white/40 max-w-sm mb-8">
                {t("error.genericDesc")}
            </p>

            {/* Retry button */}
            <button
                onClick={reset}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:brightness-110 cursor-pointer"
                style={{ background: "#39ff14", color: "#000" }}
            >
                <RotateCcw className="w-4 h-4" />
                {t("error.retry")}
            </button>
        </main>
    );
}
