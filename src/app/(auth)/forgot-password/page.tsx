"use client";

/**
 * @file app/(auth)/forgot-password/page.tsx
 * Password recovery page — enter email to receive a reset link.
 *
 * Google-only detection:
 *   Before sending the reset email, checks (via server action) if the user
 *   signed up exclusively with Google OAuth. If so, shows a specific message
 *   directing them to log in with Google instead.
 *
 * Security notes:
 *   - For non-Google users, always shows the same success message regardless
 *     of whether the email exists (prevents email enumeration).
 *   - 60-second cooldown after sending to prevent spam.
 *   - No sensitive data is logged.
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Mail, ArrowLeft, Loader2, ArrowRight } from "lucide-react";
import { useTranslation } from "@/i18n";
import { checkEmailProvider, sendResetEmail } from "./actions";
import LocaleToggle from "@/components/ui/LocaleToggle";

const COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
    const { t } = useTranslation();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [isGoogleAccount, setIsGoogleAccount] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    // ── 60-second cooldown timer ──────────────────────────────────────
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => {
            setCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (loading || cooldown > 0) return;

        setLoading(true);
        setSent(false);
        setIsGoogleAccount(false);

        try {
            // Step 1: Check if this is a Google-only account
            const provider = await checkEmailProvider(email);

            if (provider === "google") {
                setIsGoogleAccount(true);
                setLoading(false);
                return;
            }

            // Step 2: Send reset email (for email/password users or unknown emails)
            await sendResetEmail(email);
            setSent(true);
            setCooldown(COOLDOWN_SECONDS);
        } catch {
            // Silently show success to avoid revealing email existence
            setSent(true);
            setCooldown(COOLDOWN_SECONDS);
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
            {/* ── Top bar ─────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6">
                <Link
                    href="/login"
                    className="flex items-center gap-1.5 text-xs text-white/20 hover:text-white/50 transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{t("auth.backToLogin")}</span>
                </Link>
                <LocaleToggle />
            </div>

            {/* ── Logo ────────────────────────────────────── */}
            <Link href="/" className="block text-center mb-8 group">
                <div
                    className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 transition-all group-hover:shadow-[0_0_20px_rgba(57,255,20,0.15)]"
                    style={{
                        background: "rgba(57,255,20,0.08)",
                        border: "1px solid rgba(57,255,20,0.2)",
                    }}
                >
                    <Cpu className="w-7 h-7" style={{ color: "#39ff14" }} />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                    {t("auth.forgotPasswordTitle")}
                </h1>
                <p
                    className="text-xs mt-2 max-w-[260px] mx-auto leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                >
                    {t("auth.forgotPasswordDesc")}
                </p>
            </Link>

            {/* ── Card ────────────────────────────────────── */}
            <div
                className="rounded-2xl p-6"
                style={{
                    background: "#0a0a0a",
                    border: "1px solid rgba(255,255,255,0.07)",
                }}
            >
                {/* ── Google-only account message ───────── */}
                <AnimatePresence mode="wait">
                    {isGoogleAccount ? (
                        <motion.div
                            key="google-msg"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                        >
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                                style={{
                                    background: "rgba(66,133,244,0.12)",
                                    border: "1px solid rgba(66,133,244,0.3)",
                                }}
                            >
                                <GoogleIcon />
                            </div>
                            <p className="text-sm text-white/70 mb-6">
                                {t("auth.googleAccountNoPassword")}
                            </p>
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold tracking-widest text-sm transition-opacity"
                                style={{ background: "#39ff14", color: "#000" }}
                            >
                                {t("auth.backToLogin")}
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </motion.div>
                    ) : sent ? (
                        <motion.div
                            key="sent-msg"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                        >
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                                style={{
                                    background: "rgba(57,255,20,0.1)",
                                    border: "1px solid rgba(57,255,20,0.3)",
                                }}
                            >
                                <Mail
                                    className="w-5 h-5"
                                    style={{ color: "#39ff14" }}
                                />
                            </div>
                            <p
                                className="text-sm mb-6"
                                style={{ color: "rgba(255,255,255,0.6)" }}
                            >
                                {t("auth.resetEmailSent")}
                            </p>

                            {/* Cooldown button */}
                            <button
                                onClick={handleSubmit}
                                disabled={cooldown > 0}
                                className="w-full py-3 rounded-xl font-bold tracking-widest text-sm transition-opacity disabled:opacity-40"
                                style={{
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    color: "#fff",
                                }}
                            >
                                {cooldown > 0
                                    ? t("auth.resendCooldown").replace(
                                          "{seconds}",
                                          String(cooldown)
                                      )
                                    : t("auth.sendResetLink")}
                            </button>
                        </motion.div>
                    ) : (
                        <motion.form
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onSubmit={handleSubmit}
                            className="space-y-4"
                        >
                            {/* Email input */}
                            <div
                                className="flex items-center gap-3 rounded-xl px-4 py-3"
                                style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.07)",
                                }}
                            >
                                <span
                                    style={{
                                        color: "rgba(255,255,255,0.3)",
                                    }}
                                >
                                    <Mail className="w-4 h-4" />
                                </span>
                                <input
                                    id="forgot-email"
                                    type="email"
                                    placeholder={t("auth.emailPlaceholder")}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    autoFocus
                                    className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                                />
                            </div>

                            {/* Submit button */}
                            <button
                                id="forgot-submit"
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold tracking-widest text-sm transition-opacity disabled:opacity-50"
                                style={{
                                    background: "#39ff14",
                                    color: "#000",
                                }}
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        {t("auth.sendResetLink")}
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>

            <p
                className="text-center text-xs mt-6"
                style={{ color: "rgba(255,255,255,0.2)" }}
            >
                {t("auth.securedBy")}
            </p>
        </motion.div>
    );
}

// ── Google icon SVG ──────────────────────────────────────────────────────────

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 48 48">
            <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
                fill="#FBBC05"
                d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.09 24.09 0 0 0 0 21.56l7.98-6.19z"
            />
            <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
        </svg>
    );
}
