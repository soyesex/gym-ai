"use client";

/**
 * @file components/landing/LandingClient.tsx
 * Public landing page — showcases GYM-AI before login.
 *
 * Sections:
 *  1. Hero — name, tagline, CTA
 *  2. Features — 4 key features
 *  3. How it works — 3 steps
 *  4. Final CTA
 *  5. Footer
 *
 * Uses the same dark neon aesthetic (#39ff14 on #000) as the main app
 * but with a more professional, marketing-oriented layout.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import {
    Brain,
    Target,
    TrendingUp,
    Trophy,
    Cpu,
    UserPlus,
    Sparkles,
    Dumbbell,
    ArrowRight,
    ChevronDown,
    Github,
    Instagram,
    Twitter,
} from "lucide-react";
import { useTranslation } from "@/i18n";
import LocaleToggle from "@/components/ui/LocaleToggle";

// ── Animation variants ──────────────────────────────────────────────────────

const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0 },
};

const stagger = {
    visible: {
        transition: { staggerChildren: 0.12 },
    },
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
};

// ── Component ───────────────────────────────────────────────────────────────

export default function LandingClient() {
    const { t } = useTranslation();

    const features = [
        {
            icon: Brain,
            titleKey: "landing.feature1Title",
            descKey: "landing.feature1Desc",
        },
        {
            icon: Target,
            titleKey: "landing.feature2Title",
            descKey: "landing.feature2Desc",
        },
        {
            icon: TrendingUp,
            titleKey: "landing.feature3Title",
            descKey: "landing.feature3Desc",
        },
        {
            icon: Trophy,
            titleKey: "landing.feature4Title",
            descKey: "landing.feature4Desc",
        },
    ];

    const steps = [
        {
            num: "01",
            icon: UserPlus,
            titleKey: "landing.step1Title",
            descKey: "landing.step1Desc",
        },
        {
            num: "02",
            icon: Sparkles,
            titleKey: "landing.step2Title",
            descKey: "landing.step2Desc",
        },
        {
            num: "03",
            icon: Dumbbell,
            titleKey: "landing.step3Title",
            descKey: "landing.step3Desc",
        },
    ];

    return (
        <main className="min-h-screen overflow-x-hidden" style={{ background: "#000" }}>
            {/* ── Floating Nav ──────────────────────────────────────────── */}
            <motion.nav
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
                style={{
                    background: "rgba(0,0,0,0.7)",
                    backdropFilter: "blur(20px)",
                    borderBottom: "1px solid rgba(57,255,20,0.08)",
                }}
            >
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(57,255,20,0.1)", border: "1px solid rgba(57,255,20,0.2)" }}
                    >
                        <Cpu className="w-4 h-4" style={{ color: "#39ff14" }} />
                    </div>
                    <span className="text-white font-bold text-lg tracking-tight">GYM-AI</span>
                </div>
                <div className="flex items-center gap-3">
                    <LocaleToggle />
                    <Link
                        href="/login"
                        id="nav-login-btn"
                        className="px-5 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all hover:brightness-110"
                        style={{ background: "rgba(57,255,20,0.1)", color: "#39ff14", border: "1px solid rgba(57,255,20,0.25)" }}
                    >
                        {t("landing.login")}
                    </Link>
                </div>
            </motion.nav>

            {/* ── Hero Section ──────────────────────────────────────────── */}
            <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-16">
                {/* Background glow effect */}
                <div
                    className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
                    style={{
                        background: "radial-gradient(circle, rgba(57,255,20,0.08) 0%, transparent 70%)",
                        filter: "blur(80px)",
                        pointerEvents: "none",
                    }}
                />

                {/* Grid pattern overlay */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `
              linear-gradient(rgba(57,255,20,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(57,255,20,0.03) 1px, transparent 1px)
            `,
                        backgroundSize: "60px 60px",
                        pointerEvents: "none",
                    }}
                />

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={stagger}
                    className="relative z-10 text-center max-w-2xl mx-auto"
                >
                    {/* Badge */}
                    <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
                        <span
                            className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase px-4 py-1.5 rounded-full mb-6"
                            style={{ background: "rgba(57,255,20,0.08)", color: "#39ff14", border: "1px solid rgba(57,255,20,0.15)" }}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            {t("landing.badge")}
                        </span>
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        variants={fadeUp}
                        transition={{ duration: 0.6 }}
                        className="text-5xl sm:text-7xl font-bold tracking-tight text-white mt-6 mb-4"
                    >
                        GYM
                        <span style={{ color: "#39ff14" }}>-AI</span>
                    </motion.h1>

                    {/* Tagline */}
                    <motion.p
                        variants={fadeUp}
                        transition={{ duration: 0.6 }}
                        className="text-lg sm:text-xl text-white/50 max-w-md mx-auto mb-10 leading-relaxed"
                    >
                        {t("landing.tagline")}
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                        variants={fadeUp}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link
                            href="/login"
                            id="hero-cta-btn"
                            className="group flex items-center gap-2 px-8 py-4 rounded-2xl font-bold tracking-widest text-sm transition-all hover:brightness-110"
                            style={{
                                background: "#39ff14",
                                color: "#000",
                                boxShadow: "0 0 40px rgba(57,255,20,0.25)",
                            }}
                        >
                            {t("landing.cta")}
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <a
                            href="#features"
                            className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
                        >
                            {t("landing.learnMore")}
                            <ChevronDown className="w-4 h-4" />
                        </a>
                    </motion.div>
                </motion.div>

                {/* App preview mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="relative z-10 mt-16 w-full max-w-sm mx-auto"
                >
                    <div
                        className="rounded-3xl p-6 space-y-4"
                        style={{
                            background: "#0a0a0a",
                            border: "1px solid rgba(57,255,20,0.12)",
                            boxShadow: "0 0 80px rgba(57,255,20,0.08), 0 25px 50px rgba(0,0,0,0.5)",
                        }}
                    >
                        {/* Mockup header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase">{t("landing.mockWelcome")}</p>
                                <p className="text-lg font-bold" style={{ color: "#39ff14" }}>Alex M.</p>
                            </div>
                            <span
                                className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
                                style={{ background: "rgba(57,255,20,0.12)", color: "#39ff14" }}
                            >
                                LVL 3
                            </span>
                        </div>
                        {/* Mockup progress */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px]">
                                <span className="text-white/40">{t("landing.mockProgress")}</span>
                                <span style={{ color: "#39ff14" }} className="font-bold">3/5</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                                <div className="h-full rounded-full" style={{ width: "60%", background: "#39ff14" }} />
                            </div>
                        </div>
                        {/* Mockup module cards */}
                        {[t("landing.mockModule1"), t("landing.mockModule2")].map((name, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between px-4 py-3 rounded-xl"
                                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                            >
                                <div>
                                    <p className="text-xs font-semibold text-white">{name}</p>
                                    <p className="text-[10px] text-white/30">
                                        {i === 0 ? t("landing.mockModule1Detail") : t("landing.mockModule2Detail")}
                                    </p>
                                </div>
                                <div
                                    className="text-[10px] font-bold px-3 py-1.5 rounded-lg"
                                    style={{ background: "#39ff14", color: "#000" }}
                                >
                                    {t("landing.mockStart")}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Scroll hint */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2"
                >
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <ChevronDown className="w-5 h-5 text-white/20" />
                    </motion.div>
                </motion.div>
            </section>

            {/* ── Features Section ──────────────────────────────────────── */}
            <section id="features" className="py-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeUp}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-16"
                    >
                        <p
                            className="text-xs font-semibold tracking-[0.3em] uppercase mb-3"
                            style={{ color: "#39ff14" }}
                        >
                            {t("landing.featuresEyebrow")}
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-white">
                            {t("landing.featuresTitle")}
                        </h2>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-80px" }}
                        variants={stagger}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-5"
                    >
                        {features.map(({ icon: Icon, titleKey, descKey }) => (
                            <motion.div
                                key={titleKey}
                                variants={scaleIn}
                                transition={{ duration: 0.4 }}
                                className="group rounded-2xl p-6 transition-all hover:translate-y-[-2px]"
                                style={{
                                    background: "#0a0a0a",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                }}
                            >
                                <div
                                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
                                    style={{ background: "rgba(57,255,20,0.08)", border: "1px solid rgba(57,255,20,0.15)" }}
                                >
                                    <Icon className="w-5 h-5" style={{ color: "#39ff14" }} />
                                </div>
                                <h3 className="text-base font-bold text-white mb-2">{t(titleKey)}</h3>
                                <p className="text-sm text-white/40 leading-relaxed">{t(descKey)}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── How It Works ──────────────────────────────────────────── */}
            <section className="py-24 px-6 relative">
                {/* Subtle divider glow */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-px"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(57,255,20,0.2), transparent)" }}
                />

                <div className="max-w-3xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeUp}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-16"
                    >
                        <p
                            className="text-xs font-semibold tracking-[0.3em] uppercase mb-3"
                            style={{ color: "#39ff14" }}
                        >
                            {t("landing.howEyebrow")}
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-white">
                            {t("landing.howTitle")}
                        </h2>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-80px" }}
                        variants={stagger}
                        className="space-y-6"
                    >
                        {steps.map(({ num, icon: Icon, titleKey, descKey }) => (
                            <motion.div
                                key={num}
                                variants={fadeUp}
                                transition={{ duration: 0.5 }}
                                className="flex items-start gap-5 rounded-2xl p-6"
                                style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.06)" }}
                            >
                                <div
                                    className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{ background: "rgba(57,255,20,0.08)", border: "1px solid rgba(57,255,20,0.15)" }}
                                >
                                    <Icon className="w-5 h-5" style={{ color: "#39ff14" }} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1.5">
                                        <span
                                            className="text-xs font-bold tracking-widest"
                                            style={{ color: "rgba(57,255,20,0.4)" }}
                                        >
                                            {num}
                                        </span>
                                        <h3 className="text-base font-bold text-white">{t(titleKey)}</h3>
                                    </div>
                                    <p className="text-sm text-white/40 leading-relaxed">{t(descKey)}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── Final CTA ─────────────────────────────────────────────── */}
            <section className="py-24 px-6 relative">
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-px"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(57,255,20,0.2), transparent)" }}
                />

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={fadeUp}
                    transition={{ duration: 0.6 }}
                    className="max-w-lg mx-auto text-center"
                >
                    <div
                        className="rounded-3xl p-10"
                        style={{
                            background: "#0a0a0a",
                            border: "1px solid rgba(57,255,20,0.12)",
                            boxShadow: "0 0 60px rgba(57,255,20,0.06)",
                        }}
                    >
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                            style={{ background: "rgba(57,255,20,0.1)", border: "1px solid rgba(57,255,20,0.2)" }}
                        >
                            <Cpu className="w-8 h-8" style={{ color: "#39ff14" }} />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                            {t("landing.ctaTitle")}
                        </h2>
                        <p className="text-sm text-white/40 mb-8 leading-relaxed">
                            {t("landing.ctaDesc")}
                        </p>
                        <Link
                            href="/login"
                            id="final-cta-btn"
                            className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold tracking-widest text-sm transition-all hover:brightness-110"
                            style={{
                                background: "#39ff14",
                                color: "#000",
                                boxShadow: "0 0 40px rgba(57,255,20,0.25)",
                            }}
                        >
                            {t("landing.cta")}
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* ── Footer ────────────────────────────────────────────────── */}
            <footer
                className="py-10 px-6"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2.5">
                        <Cpu className="w-4 h-4" style={{ color: "#39ff14" }} />
                        <span className="text-sm font-bold text-white/60 tracking-tight">GYM-AI</span>
                    </div>

                    <p className="text-xs text-white/25 text-center">
                        {t("landing.footerMade")}
                    </p>

                    <div className="flex items-center gap-4">
                        <a
                            href="https://github.com/soyesex/gym-ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/25 hover:text-white/60 transition-colors"
                        >
                            <Github className="w-4 h-4" />
                        </a>
                        <a
                            href="#"
                            className="text-white/25 hover:text-white/60 transition-colors"
                        >
                            <Instagram className="w-4 h-4" />
                        </a>
                        <a
                            href="#"
                            className="text-white/25 hover:text-white/60 transition-colors"
                        >
                            <Twitter className="w-4 h-4" />
                        </a>
                    </div>
                </div>

                <p className="text-center text-[10px] text-white/15 mt-6">
                    © 2025 GYM-AI. {t("landing.footerRights")}
                </p>
            </footer>
        </main>
    );
}
