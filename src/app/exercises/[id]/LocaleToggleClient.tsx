"use client";

/**
 * @file app/exercises/[id]/LocaleToggleClient.tsx
 * Client component — small EN/ES toggle for the exercise detail header.
 *
 * Uses the same I18nProvider context (setLocale + router.refresh) as
 * the rest of the app so locale changes propagate to Server Components.
 */

import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n";
import type { Locale } from "@/i18n";

interface Props {
    currentLocale: Locale;
}

export default function LocaleToggleClient({ currentLocale }: Props) {
    const { locale, setLocale } = useTranslation();
    const router = useRouter();

    // Use the live context locale (may differ from server-rendered prop after hydration)
    const activeLocale = locale || currentLocale;

    function toggle() {
        const next: Locale = activeLocale === "es" ? "en" : "es";
        setLocale(next);
        router.refresh();
    }

    return (
        <button
            onClick={toggle}
            className="flex items-center gap-0.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:opacity-80"
            style={{
                background: "rgba(57,255,20,0.08)",
                border: "1px solid rgba(57,255,20,0.25)",
                color: "#39ff14",
            }}
            aria-label="Toggle language"
        >
            <span style={{ opacity: activeLocale === "es" ? 1 : 0.4 }}>ES</span>
            <span style={{ color: "rgba(57,255,20,0.3)", margin: "0 2px" }}>/</span>
            <span style={{ opacity: activeLocale === "en" ? 1 : 0.4 }}>EN</span>
        </button>
    );
}
