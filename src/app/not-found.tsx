"use client";

/**
 * @file app/not-found.tsx
 * Custom 404 page — shown when a route doesn't match.
 *
 * Design: Dark neon theme consistent with the app.
 * Auth-aware: links to /dashboard if authenticated, / if not.
 * Includes "Go back" button using router.back().
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
    const { t } = useTranslation();
    const router = useRouter();
    const [homeHref, setHomeHref] = useState("/");

    // Check for auth cookie to determine redirect target
    useEffect(() => {
        const hasSession = document.cookie
            .split(";")
            .some((c) => c.trim().startsWith("sb-"));
        setHomeHref(hasSession ? "/dashboard" : "/");
    }, []);

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-black">
            {/* Large 404 with neon glow */}
            <h1
                className="text-[120px] sm:text-[160px] font-black leading-none select-none"
                style={{
                    color: "#39ff14",
                    textShadow:
                        "0 0 20px rgba(57,255,20,0.4), 0 0 60px rgba(57,255,20,0.15)",
                }}
            >
                404
            </h1>

            {/* Friendly message */}
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-2 mb-2">
                {t("error.notFound")}
            </h2>
            <p className="text-sm text-white/40 max-w-sm mb-8">
                {t("error.notFoundDesc")}
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* Go Home — primary */}
                <Link
                    href={homeHref}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:brightness-110"
                    style={{ background: "#39ff14", color: "#000" }}
                >
                    {t("error.goHome")}
                </Link>

                {/* Go Back — secondary */}
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                    style={{
                        border: "1px solid rgba(255,255,255,0.1)",
                    }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t("error.goBack")}
                </button>
            </div>
        </main>
    );
}
