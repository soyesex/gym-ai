"use client";

/**
 * @file app/onboarding/OnboardingWizard.tsx
 *
 * Changes in this version:
 * - SCROLL: each step's motion.div fills the parent (absolute inset-0) and has
 *   overflow-y-auto, so tall content scrolls without breaking the slide animation.
 * - VALIDATIONS:
 *     Step 1 (name): requires at least 1 character to proceed.
 *     Step 2 (goals): button disabled until ≥1 goal selected. ✓ (already)
 *     Step 3 (level): button disabled until selection. ✓ (already)
 *     Step 4 (equipment): button disabled until selection. ✓ (already)
 *     Step 5 (body): weight_kg and height_cm start at 0; button disabled
 *       until the user has interacted with BOTH sliders (touched = value > 0).
 *     Step 6 (schedule): always enabled — defaults are valid (4 days, 45 min).
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Cpu, Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { saveProfile } from "./actions";
import type { Tables } from "@/lib/supabase/database.types";
import { useTranslation } from "@/i18n";

// ── Types ──────────────────────────────────────────────────────────────────────

type GoalValue = NonNullable<Tables<"profiles">["goal"]>;
type Level = Tables<"profiles">["level"];
type Equipment = Tables<"profiles">["equipment"];

interface FormData {
    full_name: string;
    goals: GoalValue[];   // multi-select; first = primary goal for DB
    level: Level;
    equipment: Equipment;
    weight_kg: number;        // 0 = untouched
    height_cm: number;        // 0 = untouched
    days_per_week: number;
    minutes_per_session: number;
}

const INITIAL_FORM: FormData = {
    full_name: "",
    goals: [],
    level: null,
    equipment: null,
    // Start at 0 so the "Next" button stays disabled until user moves the sliders
    weight_kg: 0,
    height_cm: 0,
    days_per_week: 4,
    minutes_per_session: 45,
};

const TOTAL_STEPS = 6;

// ── Animation ──────────────────────────────────────────────────────────────────
const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? "60%" : "-60%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-60%" : "60%", opacity: 0 }),
};
const slideTransition = {
    duration: 0.35,
    ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
};

// ── Option data ────────────────────────────────────────────────────────────────

interface OptionCard<T> {
    value: T; label: string; emoji: string; desc: string;
}

const GOAL_OPTIONS: OptionCard<GoalValue>[] = [
    { value: "lose_fat", label: "lose_fat", emoji: "🔥", desc: "lose_fat" },
    { value: "build_muscle", label: "build_muscle", emoji: "💪", desc: "build_muscle" },
    { value: "strength", label: "strength", emoji: "⚡", desc: "strength" },
    { value: "health", label: "health", emoji: "🧬", desc: "health" },
    { value: "performance", label: "performance", emoji: "🚀", desc: "performance" },
];

const LEVEL_OPTIONS: OptionCard<NonNullable<Level>>[] = [
    { value: "sedentary", label: "sedentary", emoji: "🛋️", desc: "sedentary" },
    { value: "beginner", label: "beginner", emoji: "🌱", desc: "beginner" },
    { value: "intermediate", label: "intermediate", emoji: "⚙️", desc: "intermediate" },
    { value: "advanced", label: "advanced", emoji: "🔩", desc: "advanced" },
    { value: "elite", label: "elite", emoji: "👑", desc: "elite" },
];

const EQUIPMENT_OPTIONS: OptionCard<NonNullable<Equipment>>[] = [
    { value: "bodyweight", label: "bodyweight", emoji: "🏠", desc: "bodyweight" },
    { value: "home_basic", label: "home_basic", emoji: "🏋️", desc: "home_basic" },
    { value: "gym_full", label: "gym_full", emoji: "🏟️", desc: "gym_full" },
];

// ── Props ──────────────────────────────────────────────────────────────────────

interface OnboardingWizardProps {
    authName: string | null;
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function OnboardingWizard({ authName }: OnboardingWizardProps) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function update<K extends keyof FormData>(key: K, value: FormData[K]) {
        setFormData((prev) => ({ ...prev, [key]: value }));
    }

    function toggleGoal(goal: GoalValue) {
        setFormData((prev) => ({
            ...prev,
            goals: prev.goals.includes(goal)
                ? prev.goals.filter((g) => g !== goal)
                : [...prev.goals, goal],
        }));
    }

    function next() { setDirection(1); setStep((s) => s + 1); }
    function back() { setDirection(-1); setStep((s) => s - 1); }

    async function finish() {
        setSaving(true);
        setError(null);
        const result = await saveProfile({
            full_name: formData.full_name || null,
            goal: formData.goals[0] ?? null,
            level: formData.level,
            equipment: formData.equipment,
            weight_kg: formData.weight_kg > 0 ? formData.weight_kg : null,
            height_cm: formData.height_cm > 0 ? formData.height_cm : null,
            days_per_week: formData.days_per_week,
            minutes_per_session: formData.minutes_per_session,
        });

        if (!result.success) {
            setError(result.message);
            setSaving(false);
            return;
        }

        setDirection(1);
        setStep(7);
    }

    const progress = step <= TOTAL_STEPS ? ((step - 1) / TOTAL_STEPS) * 100 : 100;

    // ── Per-step "can advance" check ─────────────────────────────────────────
    const canAdvance: Record<number, boolean> = {
        1: formData.full_name.trim().length > 0,
        2: formData.goals.length > 0,
        3: !!formData.level,
        4: !!formData.equipment,
        // Both sliders must have been moved off 0
        5: formData.weight_kg > 0 && formData.height_cm > 0,
        6: true, // schedule has sane defaults, always valid
    };

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{ background: "#000", maxWidth: "480px", margin: "0 auto" }}
        >
            {/* ── Top bar ──────────────────────────────── */}
            <div className="flex-none flex items-center justify-between px-6 pt-10 pb-4">
                <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5" style={{ color: "#39ff14" }} />
                    <span className="text-sm font-bold tracking-widest text-white/60">GYM-AI</span>
                </div>
                {step <= TOTAL_STEPS && (
                    <span className="text-xs text-white/30 tabular-nums">{step} / {TOTAL_STEPS}</span>
                )}
            </div>

            {/* ── Progress bar ─────────────────────────── */}
            {step <= TOTAL_STEPS && (
                <div className="flex-none px-6 mb-4">
                    <div className="h-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <motion.div
                            className="h-full rounded-full"
                            style={{ background: "#39ff14" }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        />
                    </div>
                </div>
            )}

            {/*
             * ── Scrollable step area ────────────────────────────────────────
             * The outer div is `relative overflow-hidden` — this clips the
             * sliding exit animation so it doesn't peek outside the container.
             * The motion.div is `absolute inset-0 overflow-y-auto` — this
             * fills the container AND allows vertical scroll inside each step.
             * pb-10 adds breathing room above the bottom of the scroll area.
             */}
            <div className="flex-1 relative overflow-hidden">
                <AnimatePresence custom={direction} mode="wait">
                    <motion.div
                        key={step}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={slideTransition}
                        className="absolute inset-0 overflow-y-auto px-6 pt-2 pb-10"
                        style={{ scrollbarWidth: "none" }}
                    >
                        {step === 1 && (
                            <StepName
                                value={formData.full_name}
                                authName={authName}
                                onChange={(v) => update("full_name", v)}
                                onNext={next}
                                canAdvance={canAdvance[1]}
                            />
                        )}
                        {step === 2 && (
                            <StepGoal
                                selected={formData.goals}
                                onToggle={toggleGoal}
                                onNext={next}
                                onBack={back}
                                canAdvance={canAdvance[2]}
                            />
                        )}
                        {step === 3 && (
                            <StepLevel
                                value={formData.level}
                                onChange={(v) => update("level", v)}
                                onNext={next}
                                onBack={back}
                                canAdvance={canAdvance[3]}
                            />
                        )}
                        {step === 4 && (
                            <StepEquipment
                                value={formData.equipment}
                                onChange={(v) => update("equipment", v)}
                                onNext={next}
                                onBack={back}
                                canAdvance={canAdvance[4]}
                            />
                        )}
                        {step === 5 && (
                            <StepBody
                                weight={formData.weight_kg}
                                height={formData.height_cm}
                                onWeightChange={(v) => update("weight_kg", v)}
                                onHeightChange={(v) => update("height_cm", v)}
                                onNext={next}
                                onBack={back}
                                canAdvance={canAdvance[5]}
                            />
                        )}
                        {step === 6 && (
                            <StepSchedule
                                days={formData.days_per_week}
                                minutes={formData.minutes_per_session}
                                onDaysChange={(v) => update("days_per_week", v)}
                                onMinutesChange={(v) => update("minutes_per_session", v)}
                                onFinish={finish}
                                onBack={back}
                                saving={saving}
                                error={error}
                                canAdvance={canAdvance[6]}
                            />
                        )}
                        {step === 7 && (
                            <StepComplete
                                name={formData.full_name || authName || ""}
                                onEnter={() => {
                                    router.push("/");
                                    router.refresh();
                                }}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

// ── Shared UI helpers ──────────────────────────────────────────────────────────

/**
 * Primary action button — disabled (+ visually muted) when `disabled` is true.
 * Uses opacity + reduced background so the user clearly sees it's unavailable.
 */
function NextButton({
    onClick, disabled = false, loading = false, label,
}: {
    onClick: () => void; disabled?: boolean; loading?: boolean; label?: string;
}) {
    const { t } = useTranslation();
    const btnLabel = label || t("onboarding.next");
    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold tracking-widest text-sm transition-all duration-200"
            style={{
                background: disabled ? "rgba(57,255,20,0.10)" : "#39ff14",
                color: disabled ? "rgba(57,255,20,0.4)" : "#000",
                cursor: disabled ? "not-allowed" : "pointer",
            }}
        >
            {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>{btnLabel} <ArrowRight className="w-4 h-4" /></>}
        </button>
    );
}

function BackLink({ onClick }: { onClick: () => void }) {
    const { t } = useTranslation();
    return (
        <button
            onClick={onClick}
            className="flex items-center justify-center gap-1 w-full text-xs text-white/30 hover:text-white/60 transition-colors mt-4"
        >
            <ArrowLeft className="w-3 h-3" /> {t("onboarding.back")}
        </button>
    );
}

/** Single-select option grid (Level, Equipment steps) */
function SingleOptionGrid<T extends string>({
    options, selected, onSelect, dictKey,
}: {
    options: OptionCard<T>[]; selected: T | null; onSelect: (v: T) => void; dictKey: string;
}) {
    const { t } = useTranslation();
    return (
        <div className="grid grid-cols-1 gap-3">
            {options.map((opt) => {
                const isSelected = selected === opt.value;
                return (
                    <motion.button
                        key={opt.value}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onSelect(opt.value)}
                        className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
                        style={{
                            background: isSelected ? "rgba(57,255,20,0.08)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${isSelected ? "#39ff14" : "rgba(255,255,255,0.07)"}`,
                        }}
                    >
                        <span className="text-2xl">{opt.emoji}</span>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-white">{t(`${dictKey}.${opt.label}`)}</p>
                            <p className="text-xs text-white/40 mt-0.5">{t(`onboardingDesc.${opt.desc}`)}</p>
                        </div>
                        {isSelected && (
                            <div
                                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: "#39ff14" }}
                            >
                                <Check className="w-3 h-3 text-black" />
                            </div>
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
}

/** shadcn Slider (Radix) — handles pointer-capture correctly on Windows & Chrome */
function SliderField({
    label, value, unit, min, max, step = 1, color, onChange, untouched = false,
}: {
    label: string; value: number; unit: string;
    min: number; max: number; step?: number;
    color: string; onChange: (v: number) => void;
    /** When true, shows the "—" placeholder instead of 0 */
    untouched?: boolean;
}) {
    return (
        <div
            className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}22` }}
        >
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-white/70">{label}</span>
                <div className="flex items-baseline gap-1">
                    {untouched ? (
                        <span className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.2)" }}>—</span>
                    ) : (
                        <>
                            <span className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</span>
                            <span className="text-xs text-white/30">{unit}</span>
                        </>
                    )}
                </div>
            </div>
            <Slider
                min={min}
                max={max}
                step={step}
                value={[value]}
                onValueChange={([v]) => onChange(v)}
                className="w-full"
                style={{ "--slider-color": color } as React.CSSProperties}
            />
            <div className="flex justify-between mt-2">
                <span className="text-xs text-white/20">{min}</span>
                <span className="text-xs text-white/20">{max}</span>
            </div>
        </div>
    );
}

// ── Step 1: Name ───────────────────────────────────────────────────────────────
function StepName({
    value, authName, onChange, onNext, canAdvance,
}: {
    value: string; authName: string | null;
    onChange: (v: string) => void; onNext: () => void; canAdvance: boolean;
}) {
    const { t } = useTranslation();
    return (
        <div className="pt-4">
            <p className="text-xs tracking-[0.3em] text-white/30 uppercase mb-2">{t("onboarding.step")} 1</p>
            <h2 className="text-3xl font-bold text-white mb-1">
                {t("onboarding.welcome")}{authName ? `, ${authName}` : ""},<br />
                <span style={{ color: "#39ff14" }}>{t("onboarding.letsBegin")}</span>
            </h2>
            <p className="text-sm text-white/40 mb-8">
                {t("onboarding.whatCallYou")}
            </p>

            <div
                className="flex items-center gap-3 rounded-2xl px-4 py-4 mb-2"
                style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${canAdvance ? "rgba(57,255,20,0.3)" : "rgba(255,255,255,0.08)"}`,
                    transition: "border-color 0.2s",
                }}
            >
                <input
                    id="onboarding-name"
                    type="text"
                    placeholder={authName ?? t("onboarding.yourNameAlias")}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    autoFocus
                    className="flex-1 bg-transparent text-white text-base outline-none placeholder:text-white/25"
                    onKeyDown={(e) => e.key === "Enter" && canAdvance && onNext()}
                />
            </div>
            <p className="text-xs text-white/20 mb-8 pl-1">{t("onboarding.min1Char")}</p>

            <NextButton onClick={onNext} disabled={!canAdvance} />
            <p className="text-center text-xs text-white/20 mt-4">{t("onboarding.changeLater")}</p>
        </div>
    );
}

// ── Step 2: Goals (multi-select) ───────────────────────────────────────────────
function StepGoal({
    selected, onToggle, onNext, onBack, canAdvance,
}: {
    selected: GoalValue[]; onToggle: (v: GoalValue) => void;
    onNext: () => void; onBack: () => void; canAdvance: boolean;
}) {
    const { t } = useTranslation();
    return (
        <div className="pt-4">
            <p className="text-xs tracking-[0.3em] text-white/30 uppercase mb-2">{t("onboarding.step")} 2</p>
            <h2 className="text-2xl font-bold text-white mb-1">
                {t("onboarding.primaryObjectives").split(" ")[0]} <span style={{ color: "#39ff14" }}>{t("onboarding.primaryObjectives").split(" ").slice(1).join(" ")}</span>
            </h2>
            <p className="text-sm text-white/40 mb-1">
                {t("onboarding.selectGoals")}
            </p>

            {selected.length > 0 ? (
                <p className="text-xs mb-5" style={{ color: "#39ff14" }}>
                    {t("onboarding.primary")} <strong>{t("goals." + GOAL_OPTIONS.find((o) => o.value === selected[0])?.label)}</strong>
                    {selected.length > 1 && ` + ${selected.length - 1} ${t("onboarding.more")}`}
                </p>
            ) : (
                <p className="text-xs text-white/25 mb-5">{t("onboarding.selectAtLeastOne")}</p>
            )}

            <div className="grid grid-cols-1 gap-3">
                {GOAL_OPTIONS.map((opt) => {
                    const isSelected = selected.includes(opt.value);
                    const orderIndex = selected.indexOf(opt.value);
                    return (
                        <motion.button
                            key={opt.value}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => onToggle(opt.value)}
                            className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
                            style={{
                                background: isSelected ? "rgba(57,255,20,0.08)" : "rgba(255,255,255,0.03)",
                                border: `1px solid ${isSelected ? "#39ff14" : "rgba(255,255,255,0.07)"}`,
                            }}
                        >
                            <span className="text-2xl">{opt.emoji}</span>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-white">{t(`goals.${opt.label}`)}</p>
                                <p className="text-xs text-white/40 mt-0.5">{t(`onboardingDesc.${opt.desc}`)}</p>
                            </div>
                            {isSelected ? (
                                <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                    style={{ background: "#39ff14", color: "#000" }}
                                >
                                    {orderIndex + 1}
                                </div>
                            ) : (
                                <div
                                    className="w-6 h-6 rounded-full flex-shrink-0"
                                    style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            <div className="mt-6">
                <NextButton onClick={onNext} disabled={!canAdvance} />
                <BackLink onClick={onBack} />
            </div>
        </div>
    );
}

// ── Step 3: Level ──────────────────────────────────────────────────────────────
function StepLevel({
    value, onChange, onNext, onBack, canAdvance,
}: {
    value: Level; onChange: (v: NonNullable<Level>) => void;
    onNext: () => void; onBack: () => void; canAdvance: boolean;
}) {
    const { t } = useTranslation();
    return (
        <div className="pt-4">
            <p className="text-xs tracking-[0.3em] text-white/30 uppercase mb-2">{t("onboarding.step")} 3</p>
            <h2 className="text-2xl font-bold text-white mb-1">
                {t("onboarding.experienceLevel").split(" ")[0]} <span style={{ color: "#39ff14" }}>{t("onboarding.experienceLevel").split(" ").slice(1).join(" ")}</span>
            </h2>
            <p className="text-sm text-white/40 mb-6">{t("onboarding.beHonest")}</p>
            <SingleOptionGrid dictKey="levels" options={LEVEL_OPTIONS} selected={value as NonNullable<Level> | null} onSelect={onChange} />
            <div className="mt-6">
                <NextButton onClick={onNext} disabled={!canAdvance} />
                <BackLink onClick={onBack} />
            </div>
        </div>
    );
}

// ── Step 4: Equipment ──────────────────────────────────────────────────────────
function StepEquipment({
    value, onChange, onNext, onBack, canAdvance,
}: {
    value: Equipment; onChange: (v: NonNullable<Equipment>) => void;
    onNext: () => void; onBack: () => void; canAdvance: boolean;
}) {
    const { t } = useTranslation();
    return (
        <div className="pt-4">
            <p className="text-xs tracking-[0.3em] text-white/30 uppercase mb-2">{t("onboarding.step")} 4</p>
            <h2 className="text-2xl font-bold text-white mb-1">
                {t("onboarding.equipmentAccess").split(" ")[0]} <span style={{ color: "#39ff14" }}>{t("onboarding.equipmentAccess").split(" ").slice(1).join(" ")}</span>
            </h2>
            <p className="text-sm text-white/40 mb-6">{t("onboarding.whereTrain")}</p>
            <SingleOptionGrid dictKey="equipment" options={EQUIPMENT_OPTIONS} selected={value as NonNullable<Equipment> | null} onSelect={onChange} />
            <div className="mt-6">
                <NextButton onClick={onNext} disabled={!canAdvance} />
                <BackLink onClick={onBack} />
            </div>
        </div>
    );
}

// ── Step 5: Body Metrics ───────────────────────────────────────────────────────
function StepBody({
    weight, height, onWeightChange, onHeightChange, onNext, onBack, canAdvance,
}: {
    weight: number; height: number;
    onWeightChange: (v: number) => void; onHeightChange: (v: number) => void;
    onNext: () => void; onBack: () => void; canAdvance: boolean;
}) {
    const { t } = useTranslation();
    return (
        <div className="pt-4">
            <p className="text-xs tracking-[0.3em] text-white/30 uppercase mb-2">{t("onboarding.step")} 5</p>
            <h2 className="text-2xl font-bold text-white mb-1">
                {t("onboarding.bodyMetrics").split(" ")[0]} <span style={{ color: "#39ff14" }}>{t("onboarding.bodyMetrics").split(" ").slice(1).join(" ")}</span>
            </h2>
            <p className="text-sm text-white/40 mb-2">
                {t("onboarding.usedToCalculate")}
            </p>
            <p className="text-xs text-white/25 mb-6">
                {t("onboarding.moveSliders")}
            </p>

            <div className="space-y-5 mb-8">
                <SliderField
                    label={t("profile.bodyWeight")}
                    value={weight}
                    unit="kg"
                    min={30} max={200}
                    color="#39ff14"
                    onChange={onWeightChange}
                    untouched={weight === 0}
                />
                <SliderField
                    label={t("profile.height")}
                    value={height}
                    unit="cm"
                    min={100} max={220}
                    color="#00d4ff"
                    onChange={onHeightChange}
                    untouched={height === 0}
                />
            </div>

            {/* Hint shown when one or both sliders are still at 0 */}
            {!canAdvance && (
                <p className="text-xs text-center mb-4" style={{ color: "rgba(57,255,20,0.4)" }}>
                    {weight === 0 && height === 0
                        ? t("onboarding.moveBothSlidersCont")
                        : weight === 0
                            ? t("onboarding.setBodyWeightCont")
                            : t("onboarding.setHeightCont")}
                </p>
            )}

            <NextButton onClick={onNext} disabled={!canAdvance} />
            <BackLink onClick={onBack} />
        </div>
    );
}

// ── Step 6: Schedule ───────────────────────────────────────────────────────────
function StepSchedule({
    days, minutes, onDaysChange, onMinutesChange, onFinish, onBack, saving, error, canAdvance,
}: {
    days: number; minutes: number;
    onDaysChange: (v: number) => void; onMinutesChange: (v: number) => void;
    onFinish: () => void; onBack: () => void;
    saving: boolean; error: string | null; canAdvance: boolean;
}) {
    return (
        <div className="pt-4">
            <p className="text-xs tracking-[0.3em] text-white/30 uppercase mb-2">Step 6</p>
            <h2 className="text-2xl font-bold text-white mb-1">
                Training <span style={{ color: "#39ff14" }}>Schedule</span>
            </h2>
            <p className="text-sm text-white/40 mb-8">How often and how long can you train?</p>

            <div className="space-y-5 mb-8">
                <SliderField
                    label="Days per Week" value={days} unit="days"
                    min={1} max={7} color="#a855f7" onChange={onDaysChange}
                />
                <SliderField
                    label="Session Duration" value={minutes} unit="min"
                    min={15} max={120} step={5} color="#f97316" onChange={onMinutesChange}
                />
            </div>

            {error && (
                <p className="text-xs text-red-400 mb-4 p-3 rounded-xl" style={{ background: "rgba(255,50,50,0.08)" }}>
                    {error}
                </p>
            )}

            <NextButton onClick={onFinish} loading={saving} disabled={!canAdvance} label="INITIALIZE PROTOCOL" />
            <BackLink onClick={onBack} />
        </div>
    );
}

// ── Step 7: Complete ───────────────────────────────────────────────────────────
function StepComplete({ name, onEnter }: { name: string; onEnter: () => void }) {
    return (
        <div className="pt-8 text-center">
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: "rgba(57,255,20,0.12)", border: "2px solid #39ff14" }}
            >
                <Check className="w-10 h-10" style={{ color: "#39ff14" }} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h2 className="text-3xl font-bold text-white mb-2">
                    Protocol <span style={{ color: "#39ff14" }}>Active.</span>
                </h2>
                <p className="text-sm text-white/50 mb-2">
                    Welcome to the system{name ? `, ${name}` : ""}.
                </p>
                <p className="text-xs text-white/30 mb-10">Your training AI is calibrated and ready.</p>
                <NextButton onClick={onEnter} label="ENTER THE SYSTEM" />
            </motion.div>
        </div>
    );
}
