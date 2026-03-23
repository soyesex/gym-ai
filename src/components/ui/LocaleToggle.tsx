"use client";

/**
 * @file components/ui/LocaleToggle.tsx
 * Language toggle button (ES / EN) — used across the app.
 *
 * Uses the i18n context to switch locale, which persists
 * to both localStorage and a cookie so Server Components
 * can also pick up the preference.
 */

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n";
import type { Locale } from "@/i18n";

const LOCALES: { value: Locale; label: string }[] = [
    { value: "es", label: "ES" },
    { value: "en", label: "EN" },
];

export default function LocaleToggle() {
    const { locale, setLocale } = useTranslation();
    const router = useRouter();

    return (
        <div
            className="flex rounded-lg p-0.5 gap-0.5"
            style={{ background: "rgba(255,255,255,0.06)" }}
        >
            {LOCALES.map(({ value, label }) => {
                const isActive = locale === value;
                return (
                    <button
                        key={value}
                        id={`locale-toggle-${value}`}
                        onClick={() => {
                            setLocale(value);
                            router.refresh();
                        }}
                        className="relative px-2.5 py-1 text-[11px] font-bold tracking-wider rounded-md transition-colors"
                        style={{ color: isActive ? "#000" : "rgba(255,255,255,0.4)" }}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="locale-indicator"
                                className="absolute inset-0 rounded-md"
                                style={{ background: "#39ff14" }}
                                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                            />
                        )}
                        <span className="relative z-10">{label}</span>
                    </button>
                );
            })}
        </div>
    );
}
