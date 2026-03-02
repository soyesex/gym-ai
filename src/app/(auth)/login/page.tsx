"use client";

/**
 * @file app/(auth)/login/page.tsx
 * Login & Sign-up page — two modes toggled with a tab switcher.
 *
 * Data flow:
 *   User submits form → calls Supabase Auth (signInWithPassword / signUp)
 *   → on success: router.push("/") redirects to the protected dashboard
 *   → on error: shows inline error message
 *
 * The actual session cookie is written by Supabase's SSR helper
 * via the middleware on the next request, so no manual cookie handling needed here.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Which tab is active
type AuthMode = "login" | "signup";

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();

    const [mode, setMode] = useState<AuthMode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
                router.push("/");
                router.refresh(); // forces Next.js to re-run Server Components with the new session
            } else {
                // ── Sign Up ────────────────────────────────────────────
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        // Pass extra metadata — stored in auth.users.raw_user_meta_data
                        // The DB trigger reads this to populate the profiles row.
                        data: { username },
                    },
                });

                if (signUpError) throw signUpError;

                // If email confirmation is DISABLED in Supabase (dev mode),
                // signUp returns a live session immediately — redirect to onboarding.
                // If email confirmation is ENABLED, session is null — show the email prompt.
                if (signUpData.session) {
                    router.refresh();
                    router.push("/"); // page.tsx will detect goal=null → redirect to /onboarding
                } else {
                    setSuccessMsg(
                        "Account created! Check your email to confirm your address, then log in."
                    );
                    setMode("login");
                }
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unexpected error occurred.");
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
            {/* ── Logo / Header ─────────────────────────────────────── */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                    style={{ background: "rgba(57,255,20,0.08)", border: "1px solid rgba(57,255,20,0.2)" }}>
                    <Cpu className="w-7 h-7" style={{ color: "#39ff14" }} />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">GYM-AI</h1>
                <p className="text-xs tracking-[0.25em] uppercase mt-1"
                    style={{ color: "rgba(255,255,255,0.35)" }}>
                    Underground Tech Fitness
                </p>
            </div>

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
                            {tab === "login" ? "Log In" : "Sign Up"}
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
                                    placeholder="Username"
                                    value={username}
                                    onChange={setUsername}
                                    icon={<User className="w-4 h-4" />}
                                    required
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <InputField
                        id="auth-email"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={setEmail}
                        icon={<Mail className="w-4 h-4" />}
                        required
                    />

                    <InputField
                        id="auth-password"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={setPassword}
                        icon={<Lock className="w-4 h-4" />}
                        required
                        minLength={8}
                    />

                    {/* Error / Success feedback */}
                    <AnimatePresence>
                        {error && (
                            <motion.p
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
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold tracking-widest text-sm transition-opacity disabled:opacity-50"
                        style={{ background: "#39ff14", color: "#000" }}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                {mode === "login" ? "ACCESS SYSTEM" : "INITIALIZE PROTOCOL"}
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>
            </div>

            <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.2)" }}>
                Secured by Supabase Auth · RLS enabled
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
