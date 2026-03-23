"use client";

/**
 * @file app/auth/reset-password/form/page.tsx
 * Password reset form — user arrives here AFTER the server-side
 * code exchange in /auth/reset-password/route.ts.
 *
 * At this point:
 *   - If the code exchange succeeded, a "reset-uid" httpOnly cookie
 *     holds the user_id. The form calls a Server Action that reads
 *     this cookie and uses admin.updateUserById() to set the password.
 *   - If the code was expired/invalid, ?error=expired is in the URL.
 *
 * No client-side Supabase session is needed — password update happens
 * entirely server-side via the admin client.
 */
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Lock, ArrowRight, ArrowLeft, Loader2, Check, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/i18n";
import LocaleToggle from "@/components/ui/LocaleToggle";
import PasswordChecklist from "@/components/ui/PasswordChecklist";
import { resetPassword } from "./actions";

export default function ResetPasswordFormPage() {
    const { t } = useTranslation();
    const searchParams = useSearchParams();

    const isExpired = searchParams.get("error") === "expired";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg(null);

        // ── Client-side validations ───────────────────────────────────
        if (password.length < 8) {
            setErrorMsg(t("auth.passwordTooWeak"));
            return;
        }
        if (password !== confirmPassword) {
            setErrorMsg(t("auth.passwordsDoNotMatch"));
            return;
        }

        setSubmitting(true);

        try {
            const result = await resetPassword(password);

            if (!result.success) {
                setErrorMsg(t(result.errorKey ?? "auth.passwordResetError"));
            } else {
                setSuccess(true);
            }
        } catch {
            setErrorMsg(t("auth.passwordResetError"));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center px-5"
            style={{ background: "#000" }}
        >
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-sm"
            >
                {/* ── Top bar ─────────────────────────────── */}
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

                {/* ── Logo ────────────────────────────────── */}
                <div className="text-center mb-8">
                    <div
                        className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                        style={{
                            background: "rgba(57,255,20,0.08)",
                            border: "1px solid rgba(57,255,20,0.2)",
                        }}
                    >
                        <Cpu className="w-7 h-7" style={{ color: "#39ff14" }} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        {t("auth.resetPasswordTitle")}
                    </h1>
                </div>

                {/* ── Card ────────────────────────────────── */}
                <div
                    className="rounded-2xl p-6"
                    style={{
                        background: "#0a0a0a",
                        border: "1px solid rgba(255,255,255,0.07)",
                    }}
                >
                    <AnimatePresence mode="wait">
                        {/* ── Expired link ──────────────────── */}
                        {isExpired && !success ? (
                            <motion.div
                                key="expired"
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-center"
                            >
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                                    style={{
                                        background: "rgba(251,191,36,0.1)",
                                        border: "1px solid rgba(251,191,36,0.3)",
                                    }}
                                >
                                    <AlertTriangle
                                        className="w-5 h-5"
                                        style={{ color: "#fbbf24" }}
                                    />
                                </div>
                                <p className="text-sm text-white/60 mb-6">
                                    {t("auth.resetLinkExpired")}
                                </p>
                                <Link
                                    href="/forgot-password"
                                    className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold tracking-widest text-sm"
                                    style={{
                                        background: "#39ff14",
                                        color: "#000",
                                    }}
                                >
                                    {t("auth.retryResetPassword")}
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </motion.div>

                        /* ── Success ──────────────────────── */
                        ) : success ? (
                            <motion.div
                                key="success"
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
                                    <Check
                                        className="w-5 h-5"
                                        style={{ color: "#39ff14" }}
                                    />
                                </div>
                                <p
                                    className="text-sm mb-6"
                                    style={{ color: "#39ff14" }}
                                >
                                    {t("auth.passwordResetSuccess")}
                                </p>
                                <Link
                                    href="/login"
                                    className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold tracking-widest text-sm"
                                    style={{
                                        background: "#39ff14",
                                        color: "#000",
                                    }}
                                >
                                    {t("auth.backToLogin")}
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </motion.div>

                        /* ── Password form ────────────────── */
                        ) : (
                            <motion.form
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onSubmit={handleSubmit}
                                className="space-y-4"
                            >
                                {/* New password */}
                                <div
                                    className="flex items-center gap-3 rounded-xl px-4 py-3"
                                    style={{
                                        background: "rgba(255,255,255,0.04)",
                                        border: "1px solid rgba(255,255,255,0.07)",
                                    }}
                                >
                                    <span style={{ color: "rgba(255,255,255,0.3)" }}>
                                        <Lock className="w-4 h-4" />
                                    </span>
                                    <input
                                        id="reset-password"
                                        type="password"
                                        placeholder={t("auth.newPassword")}
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        required
                                        minLength={8}
                                        autoComplete="new-password"
                                        autoFocus
                                        className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                                    />
                                </div>

                                {/* Password strength checklist */}
                                <PasswordChecklist password={password} />

                                {/* Confirm password */}
                                <div
                                    className="flex items-center gap-3 rounded-xl px-4 py-3"
                                    style={{
                                        background: "rgba(255,255,255,0.04)",
                                        border: "1px solid rgba(255,255,255,0.07)",
                                    }}
                                >
                                    <span style={{ color: "rgba(255,255,255,0.3)" }}>
                                        <Lock className="w-4 h-4" />
                                    </span>
                                    <input
                                        id="reset-confirm-password"
                                        type="password"
                                        placeholder={t("auth.confirmPassword")}
                                        value={confirmPassword}
                                        onChange={(e) =>
                                            setConfirmPassword(e.target.value)
                                        }
                                        required
                                        minLength={8}
                                        autoComplete="new-password"
                                        className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                                    />
                                </div>

                                {/* Error message */}
                                <AnimatePresence>
                                    {errorMsg && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="text-xs text-red-400 rounded-lg px-3 py-2"
                                            style={{
                                                background: "rgba(255,50,50,0.08)",
                                            }}
                                        >
                                            {errorMsg}
                                        </motion.p>
                                    )}
                                </AnimatePresence>

                                {/* Submit */}
                                <button
                                    id="reset-submit"
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold tracking-widest text-sm transition-opacity disabled:opacity-50"
                                    style={{
                                        background: "#39ff14",
                                        color: "#000",
                                    }}
                                >
                                    {submitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            {t("auth.resetPasswordSubmit")}
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
        </div>
    );
}
