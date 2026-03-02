"use client";

/**
 * @file i18n/I18nProvider.tsx
 * Lightweight i18n provider using React Context.
 *
 * How it works:
 *   1. On mount, reads the saved locale from `localStorage` (key: "gym-ai-locale").
 *      Falls back to `"en"` if nothing stored.
 *   2. Exposes `locale`, `setLocale`, and `t(key)` via context.
 *   3. `t(key)` supports dot-notation (e.g. `t("nav.home")`) to traverse
 *      the nested JSON dictionaries.
 *   4. When `setLocale` is called, the new value is persisted to `localStorage`
 *      so the choice survives page reloads.
 *
 * Data flow:
 *   RootLayout → <I18nProvider> wraps the entire app
 *   Any client component → `const { t } = useTranslation()` → t("key")
 */

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from "react";

import en from "./en.json";
import es from "./es.json";

// ── Types ──────────────────────────────────────────────────────────────────────

/** Supported locales — extend this union when adding new languages */
export type Locale = "en" | "es";

/** The shape of our JSON dictionaries (recursive string map) */
type Dictionary = Record<string, unknown>;

interface I18nContextValue {
    /** Current active locale */
    locale: Locale;
    /** Switch to a different locale (persists to localStorage) */
    setLocale: (locale: Locale) => void;
    /** Translate a dot-notation key, e.g. t("nav.home") → "Home" */
    t: (key: string) => string;
}

// ── Dictionary map ─────────────────────────────────────────────────────────────

const dictionaries: Record<Locale, Dictionary> = { en, es };

const STORAGE_KEY = "gym-ai-locale";

// ── Context ────────────────────────────────────────────────────────────────────

const I18nContext = createContext<I18nContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

export function I18nProvider({ children, initialLocale = "en" }: { children: ReactNode; initialLocale?: Locale }) {
    // SSR-safe: start with the cookie-provided locale, then hydrate from localStorage
    const [locale, setLocaleState] = useState<Locale>(initialLocale);

    // Hydrate from localStorage once the component mounts on the client
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "en" || stored === "es") {
            setLocaleState(stored);
        }
    }, []);

    /**
     * Updates the locale in both React state and localStorage.
     * Also sets a cookie so Server Components can read the preference,
     * and updates the <html lang="..."> attribute for accessibility.
     */
    const setLocale = useCallback((next: Locale) => {
        setLocaleState(next);
        localStorage.setItem(STORAGE_KEY, next);
        document.cookie = `${STORAGE_KEY}=${next};path=/;max-age=31536000;SameSite=Lax`;
        document.documentElement.lang = next;
    }, []);

    /**
     * Translates a dot-notation key by traversing the active dictionary.
     * Returns the key itself as fallback if the path is not found,
     * making missing translations easy to spot during development.
     */
    const t = useCallback(
        (key: string): string => {
            const parts = key.split(".");
            let current: unknown = dictionaries[locale];

            for (const part of parts) {
                if (current && typeof current === "object" && part in (current as Dictionary)) {
                    current = (current as Dictionary)[part];
                } else {
                    // Key not found — return the raw key so it's easy to spot
                    return key;
                }
            }

            return typeof current === "string" ? current : key;
        },
        [locale]
    );

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

/**
 * Access the i18n context from any client component.
 *
 * @example
 * ```tsx
 * const { t, locale, setLocale } = useTranslation();
 * return <p>{t("nav.home")}</p>;
 * ```
 */
export function useTranslation(): I18nContextValue {
    const ctx = useContext(I18nContext);
    if (!ctx) {
        throw new Error("useTranslation must be used within <I18nProvider>");
    }
    return ctx;
}
