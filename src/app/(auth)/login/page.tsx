"use client";

/**
 * @file app/(auth)/login/page.tsx
 * Login & Sign-up page — two modes toggled with a tab switcher.
 *
 * Data flow:
 *   User submits form → calls Supabase Auth (signInWithPassword / signUp)
 *   → on success: router.push("/dashboard") redirects to the protected dashboard
 *   → on error: shows inline error message
 *
 * The actual session cookie is written by Supabase's SSR helper
 * via the middleware on the next request, so no manual cookie handling needed here.
 */
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Mail, Lock, User, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/i18n";
import LocaleToggle from "@/components/ui/LocaleToggle";
import PasswordChecklist from "@/components/ui/PasswordChecklist";

// Which tab is active
type AuthMode = "login" | "signup";

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();
    const { t } = useTranslation();

    const [mode, setMode] = useState<AuthMode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isUsernameChecking, setIsUsernameChecking] = useState(false);
    const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
    const [usernameCheckError, setUsernameCheckError] = useState<boolean>(false);
    const searchParams = useSearchParams();

    // ── Read OAuth error from query params on mount ───────────────────
    useEffect(() => {
        const errorParam = searchParams.get("error");
        if (errorParam === "cancelled") {
            setError(t("auth.oauthCancelled"));
        } else if (errorParam === "oauth_error") {
            setError(t("auth.oauthError"));
        }
        // Clean URL without triggering a navigation
        if (errorParam) {
            window.history.replaceState({}, "", "/login");
        }
    }, [searchParams, t]);

    useEffect(() => {
        if (mode !== "signup" || !username) {
            setIsUsernameAvailable(null);
            setIsUsernameChecking(false);
            return;
        }
        
        setIsUsernameChecking(true);
        setUsernameCheckError(false);
        const timeoutId = setTimeout(async () => {
            const cleanUsername = username.trim().toLowerCase();
            if (!cleanUsername) {
                setIsUsernameAvailable(null);
                setIsUsernameChecking(false);
                return;
            }

            const { data, error } = await supabase.rpc('is_username_available', { search_username: cleanUsername });
            if (error) {
                setIsUsernameAvailable(null);
                setUsernameCheckError(true);
            } else if (data !== null) {
                setIsUsernameAvailable(data);
                setUsernameCheckError(false);
            }
            setIsUsernameChecking(false);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [username, mode, supabase]);

    /** Handles both sign-in and sign-up in a single submit handler */
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        setLoading(true);

        try {
            if (mode === "login") {
                // ── Sign In ────────────────────────────────────────────
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;
                // Session cookie is set; redirect to dashboard
                document.cookie = "gym_ai_first_session=1; path=/";
                router.push("/dashboard");
                router.refresh(); // forces Next.js to re-run Server Components with the new session
            } else {
                // ── Sign Up (via server-side API route with HIBP validation) ──
                const cleanUsername = username.trim().toLowerCase();
                const res = await fetch("/api/auth/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email,
                        password,
                        username: cleanUsername,
                    }),
                });

                const data = await res.json();

                if (!res.ok) {
                    // data.error is an i18n key (e.g., "auth.passwordBreached")
                    // or a raw Supabase error message
                    const errorKey = data.error;
                    const translated = t(errorKey);
                    // If t() returns the key itself, it's a raw message — show as-is
                    throw new Error(translated !== errorKey ? translated : errorKey);
                }

                // If email confirmation is DISABLED in Supabase (dev mode),
                // signUp returns a live session immediately — redirect to onboarding.
                // If email confirmation is ENABLED, session is false — show the email prompt.
                if (data.session) {
                    document.cookie = "gym_ai_first_session=1; path=/";
                    router.refresh();
                    router.push("/dashboard");
                } else {
                    setSuccessMsg(t("auth.signupSuccess"));
                    setMode("login");
                }
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError(t("auth.unexpectedError"));
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-sm"
        >
            {/* ── Top bar: Back link + Locale Toggle ─────────────── */}
            <div className="flex items-center justify-between mb-6">
                <Link
                    href="/"
                    className="flex items-center gap-1.5 text-xs text-white/20 hover:text-white/50 transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{t("auth.back")}</span>
                </Link>
                <LocaleToggle />
            </div>

            {/* ── Logo / Header (clickable → landing) ─────────────── */}
            <Link href="/" className="block text-center mb-8 group">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 transition-all group-hover:shadow-[0_0_20px_rgba(57,255,20,0.15)]"
                    style={{ background: "rgba(57,255,20,0.08)", border: "1px solid rgba(57,255,20,0.2)" }}>
                    <Cpu className="w-7 h-7" style={{ color: "#39ff14" }} />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">GYM-AI</h1>
                <p className="text-xs tracking-[0.25em] uppercase mt-1"
                    style={{ color: "rgba(255,255,255,0.35)" }}>
                    {t("auth.subtitle")}
                </p>
            </Link>

            {/* ── Card ──────────────────────────────────────────────── */}
            <div
                className="rounded-2xl p-6"
                style={{
                    background: "#0a0a0a",
                    border: "1px solid rgba(255,255,255,0.07)",
                }}
            >
                {/* Mode tab switcher */}
                <div
                    className="flex rounded-xl p-1 mb-6"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                >
                    {(["login", "signup"] as AuthMode[]).map((tab) => (
                        <button
                            key={tab}
                            id={`auth-tab-${tab}`}
                            onClick={() => { setMode(tab); setError(null); setSuccessMsg(null); }}
                            className="flex-1 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200"
                            style={
                                mode === tab
                                    ? { background: "#39ff14", color: "#000" }
                                    : { color: "rgba(255,255,255,0.4)" }
                            }
                        >
                            {tab === "login" ? t("auth.logIn") : t("auth.signUp")}
                        </button>
                    ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Username input — only shown in sign-up mode */}
                    <AnimatePresence>
                        {mode === "signup" && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <InputField
                                    id="auth-username"
                                    type="text"
                                    placeholder={t("auth.usernamePlaceholder")}
                                    value={username}
                                    onChange={setUsername}
                                    icon={<User className="w-4 h-4" />}
                                    required
                                />
                                {username.length > 0 && !isUsernameChecking && (
                                    <>
                                        {usernameCheckError ? (
                                            <p className="text-xs mt-1.5 text-red-500">{t("auth.usernameCheckError")}</p>
                                        ) : typeof isUsernameAvailable === "boolean" ? (
                                            <p className={`text-xs mt-1.5 ${isUsernameAvailable ? "text-[#39ff14]" : "text-red-400"}`}>
                                                {isUsernameAvailable ? t("auth.usernameAvailable") : t("auth.usernameTaken")}
                                            </p>
                                        ) : null}
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <InputField
                        id="auth-email"
                        type="email"
                        placeholder={t("auth.emailPlaceholder")}
                        value={email}
                        onChange={setEmail}
                        icon={<Mail className="w-4 h-4" />}
                        required
                    />

                    <InputField
                        id="auth-password"
                        type="password"
                        placeholder={t("auth.passwordPlaceholder")}
                        value={password}
                        onChange={setPassword}
                        icon={<Lock className="w-4 h-4" />}
                        required
                        minLength={8}
                    />

                    {/* Password strength checklist — sign-up mode only */}
                    {mode === "signup" && <PasswordChecklist password={password} />}

                    {/* Error / Success feedback */}
                    <AnimatePresence>
                        {error && (
                            <motion.p
                                data-testid="auth-error"
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-xs text-red-400 rounded-lg px-3 py-2"
                                style={{ background: "rgba(255,50,50,0.08)" }}
                            >
                                {error}
                            </motion.p>
                        )}
                        {successMsg && (
                            <motion.p
                                data-testid="auth-success"
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-xs rounded-lg px-3 py-2"
                                style={{ background: "rgba(57,255,20,0.08)", color: "#39ff14" }}
                            >
                                {successMsg}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    {/* Submit button */}
                    <button
                        id="auth-submit"
                        type="submit"
                        disabled={loading || (mode === "signup" && (isUsernameChecking || isUsernameAvailable === false || usernameCheckError))}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold tracking-widest text-sm transition-opacity disabled:opacity-50"
                        style={{ background: "#39ff14", color: "#000" }}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                {mode === "login" ? t("auth.loginSubmit") : t("auth.signupSubmit")}
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                {/* ── "or" divider ──────────────────────────────────── */}
                <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                    <span className="text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>
                        {t("auth.orDivider")}
                    </span>
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                </div>

                {/* ── Google OAuth button ───────────────────────────── */}
                <button
                    id="auth-google"
                    type="button"
                    disabled={googleLoading || loading}
                    onClick={async () => {
                        setGoogleLoading(true);
                        setError(null);
                        document.cookie = "gym_ai_first_session=1; path=/";
                        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
                        await supabase.auth.signInWithOAuth({
                            provider: "google",
                            options: {
                                redirectTo: `${siteUrl}/auth/callback`,
                            },
                        });
                    }}
                    className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-sm transition-all hover:brightness-110 disabled:opacity-50"
                    style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff",
                    }}
                >
                    {googleLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <GoogleIcon />
                            {t("auth.continueWithGoogle")}
                        </>
                    )}
                </button>
            </div>

            {/* ── Forgot password link (login mode only) ───────────── */}
            <AnimatePresence>
                {mode === "login" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center mt-4"
                    >
                        <Link
                            href="/forgot-password"
                            className="text-xs transition-colors hover:underline"
                            style={{ color: "rgba(255,255,255,0.35)" }}
                        >
                            {t("auth.forgotPassword")}
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>

            <p className="text-center text-xs mt-4" style={{ color: "rgba(255,255,255,0.2)" }}>
                {t("auth.securedBy")}
            </p>
        </motion.div>
    );
}

// ── Reusable input component (kept local — only used on this page) ──────────

interface InputFieldProps {
    id: string;
    type: string;
    placeholder: string;
    value: string;
    onChange: (val: string) => void;
    icon: React.ReactNode;
    required?: boolean;
    minLength?: number;
}

function InputField({ id, type, placeholder, value, onChange, icon, required, minLength }: InputFieldProps) {
    return (
        <div
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
            }}
        >
            <span style={{ color: "rgba(255,255,255,0.3)" }}>{icon}</span>
            <input
                id={id}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                minLength={minLength}
                autoComplete={type === "password" ? "current-password" : type === "email" ? "email" : "username"}
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
            />
        </div>
    );
}

// ── Google icon SVG (official colors) ────────────────────────────────────────

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.09 24.09 0 0 0 0 21.56l7.98-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
    );
}
