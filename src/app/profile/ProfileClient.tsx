"use client";

/**
 * @file app/profile/ProfileClient.tsx
 * Full profile view + inline editing for every section.
 *
 * Edit pattern (shared by every section):
 *   Each section has a local `editing` boolean + a draft copy of its fields.
 *   Tapping "Edit" opens inline controls, "Save" calls the Server Action,
 *   "Cancel" resets the draft. No modals, no page navigation.
 *
 * Data flow:
 *   props (from Server Component) → read view
 *   "Edit" click → draft state (copy of current values)
 *   "Save" → updateProfile(draft) Server Action → success → close edit panel
 *   "Logout" → signOut() Server Action → router.push("/login")
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Check, ChevronRight, Loader2,
    LogOut, User, Target, Dumbbell, Scale, Calendar, Globe,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { updateProfile, signOut } from "./actions";
import BottomNav from "@/components/home/BottomNav";
import { useTranslation, type Locale } from "@/i18n";
import type { Tables } from "@/lib/supabase/database.types";

// ── Types ──────────────────────────────────────────────────────────────────────

type Profile = Tables<"profiles">;
type Goal = Profile["goal"];
type Level = Profile["level"];
type Equipment = Profile["equipment"];

interface ProfileClientProps {
    authEmail: string | null;
    profile: Profile | null;
}

// ── Static option data (mirrors OnboardingWizard) ─────────────────────────────

/** i18n key used with t() to get the translated label */
const GOAL_OPTIONS: { value: NonNullable<Goal>; i18nKey: string; emoji: string }[] = [
    { value: "lose_fat", i18nKey: "goals.lose_fat", emoji: "🔥" },
    { value: "build_muscle", i18nKey: "goals.build_muscle", emoji: "💪" },
    { value: "strength", i18nKey: "goals.strength", emoji: "⚡" },
    { value: "health", i18nKey: "goals.health", emoji: "🧬" },
    { value: "performance", i18nKey: "goals.performance", emoji: "🚀" },
];

const LEVEL_OPTIONS: { value: NonNullable<Level>; i18nKey: string; emoji: string }[] = [
    { value: "sedentary", i18nKey: "levels.sedentary", emoji: "🛋️" },
    { value: "beginner", i18nKey: "levels.beginner", emoji: "🌱" },
    { value: "intermediate", i18nKey: "levels.intermediate", emoji: "⚙️" },
    { value: "advanced", i18nKey: "levels.advanced", emoji: "🔩" },
    { value: "elite", i18nKey: "levels.elite", emoji: "👑" },
];

const EQUIPMENT_OPTIONS: { value: NonNullable<Equipment>; i18nKey: string; emoji: string }[] = [
    { value: "bodyweight", i18nKey: "equipment.bodyweight", emoji: "🏠" },
    { value: "home_basic", i18nKey: "equipment.home_basic", emoji: "🏋️" },
    { value: "gym_full", i18nKey: "equipment.gym_full", emoji: "🏟️" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Derives the display name with the same priority chain as the dashboard */
function getDisplayName(profile: Profile | null, email: string | null): string {
    return (
        profile?.full_name ??
        profile?.username ??
        email?.split("@")[0] ??
        "Agent"
    );
}

/** Generates initials (up to 2 chars) from the display name */
function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase();
}

/** Returns the i18n key for an enum value, to be passed to t() */
function i18nKeyFor<T extends string>(
    options: { value: T; i18nKey: string; emoji: string }[],
    value: T | null | undefined
): string {
    if (!value) return "";
    return options.find((o) => o.value === value)?.i18nKey ?? value;
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ProfileClient({ authEmail, profile }: ProfileClientProps) {
    const router = useRouter();
    const { t } = useTranslation();
    const [loggingOut, setLoggingOut] = useState(false);

    const displayName = getDisplayName(profile, authEmail);
    const initials = getInitials(displayName);
    const xp = profile?.current_xp ?? 0;
    const level = Math.floor(xp / 1000) + 1;

    async function handleLogout() {
        setLoggingOut(true);
        await signOut();
        router.push("/login");
    }

    return (
        <div
            className="min-h-screen pb-24"
            style={{ background: "#000", maxWidth: "480px", margin: "0 auto" }}
        >
            {/* ── Header ─────────────────────────────────────── */}
            <div className="px-5 pt-12 pb-6">
                {/* Back arrow */}
                <button
                    onClick={() => router.push("/")}
                    className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> {t("profile.dashboard")}
                </button>

                <div className="flex items-center gap-4">
                    {/* Initials avatar */}
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl font-bold"
                        style={{ background: "rgba(57,255,20,0.1)", border: "1.5px solid rgba(57,255,20,0.3)", color: "#39ff14" }}
                    >
                        {initials}
                    </div>

                    <div>
                        <h1 className="text-xl font-bold text-white leading-tight">{displayName}</h1>
                        <p className="text-xs text-white/40 mt-0.5">{authEmail}</p>
                        <div
                            className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ background: "rgba(57,255,20,0.1)", color: "#39ff14" }}
                        >
                            <span>Lv.{level}</span>
                            <span className="text-white/30">·</span>
                            <span>{xp.toLocaleString()} XP</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Sections ───────────────────────────────────── */}
            <div className="px-5 space-y-3">

                {/* Language */}
                <LanguageSection />

                {/* Identity */}
                <IdentitySection profile={profile} />

                {/* Goal & Level */}
                <GoalLevelSection profile={profile} />

                {/* Equipment */}
                <EquipmentSection profile={profile} />

                {/* Body Metrics */}
                <BodySection profile={profile} />

                {/* Schedule */}
                <ScheduleSection profile={profile} />

                {/* Account / Logout */}
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                >
                    <SectionHeader icon={<User className="w-4 h-4" />} label={t("profile.account")} />
                    <div className="px-4 pb-4">
                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all"
                            style={{
                                background: "rgba(239,68,68,0.08)",
                                border: "1px solid rgba(239,68,68,0.2)",
                                color: "#ef4444",
                            }}
                        >
                            {loggingOut
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <><LogOut className="w-4 h-4" /> {t("profile.logOut")}</>}
                        </button>
                    </div>
                </div>

            </div>

            <BottomNav />
        </div>
    );
}

// ── Shared section primitives ──────────────────────────────────────────────────

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div
            className="flex items-center gap-2 px-4 py-3 border-b"
            style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
            <span style={{ color: "#39ff14" }}>{icon}</span>
            <span className="text-xs font-bold tracking-widest uppercase text-white/50">{label}</span>
        </div>
    );
}

/**
 * Wrapper that handles the save logic shared by all editable sections.
 *
 * `hasChanges` — true when the draft differs from the persisted values.
 *   The Save button is disabled (+ visually dimmed) until this is true.
 * `onReset`    — called when the user cancels, so the section can restore
 *   its draft state to match the current persisted values.
 */
function EditableSection({
    icon, label, summary, children, getPayload, hasChanges, onReset, onSaved,
}: {
    icon: React.ReactNode;
    label: string;
    summary: React.ReactNode;
    children: React.ReactNode;
    getPayload: () => Parameters<typeof updateProfile>[0];
    /** True when draft differs from original — enables the Save button */
    hasChanges: boolean;
    /** Resets draft state in the child section back to original values */
    onReset?: () => void;
    onSaved?: () => void;
}) {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSave() {
        setSaving(true);
        setError(null);
        const result = await updateProfile(getPayload());
        setSaving(false);
        if (!result.success) { setError(result.message); return; }
        setEditing(false);
        onSaved?.();
    }

    function handleCancel() {
        setEditing(false);
        setError(null);
        onReset?.(); // restore draft to the persisted values
    }

    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}
        >
            <SectionHeader icon={icon} label={label} />

            {/* Collapsed read view + edit trigger */}
            {!editing && (
                <button
                    onClick={() => setEditing(true)}
                    className="w-full flex items-center justify-between px-4 py-4 group"
                >
                    <div className="text-left">{summary}</div>
                    <EditLabel />
                </button>
            )}

            {/* Inline edit panel */}
            <AnimatePresence>
                {editing && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-2 space-y-4">
                            {children}

                            {error && (
                                <p className="text-xs text-red-400 px-3 py-2 rounded-xl" style={{ background: "rgba(255,50,50,0.08)" }}>
                                    {error}
                                </p>
                            )}

                            <div className="flex gap-2">
                                <CancelButton onClick={handleCancel} />
                                <SaveButton onClick={handleSave} saving={saving} hasChanges={hasChanges} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Section: Identity ──────────────────────────────────────────────────────────

function IdentitySection({ profile }: { profile: Profile | null }) {
    const { t } = useTranslation();
    const origName = profile?.full_name ?? "";
    const origUsername = profile?.username ?? "";

    const [name, setName] = useState(origName);
    const [username, setUsername] = useState(origUsername);

    const hasChanges =
        name.trim() !== origName.trim() ||
        username.trim() !== origUsername.trim();

    function reset() {
        setName(origName);
        setUsername(origUsername);
    }

    return (
        <EditableSection
            icon={<User className="w-4 h-4" />}
            label={t("profile.identity")}
            summary={
                <div>
                    <p className="text-sm font-semibold text-white">{profile?.full_name || "—"}</p>
                    <p className="text-xs text-white/40 mt-0.5">@{profile?.username || t("profile.noUsernameSet")}</p>
                </div>
            }
            getPayload={() => ({ full_name: name.trim() || null, username: username.trim() || null })}
            hasChanges={hasChanges}
            onReset={reset}
        >
            <TextInput label={t("profile.displayName")} value={name} onChange={setName} placeholder="Your name" />
            <TextInput label={t("profile.username")} value={username} onChange={setUsername} placeholder="@alias" />
        </EditableSection>
    );
}

// ── Section: Goal & Level ──────────────────────────────────────────────────────

function GoalLevelSection({ profile }: { profile: Profile | null }) {
    const { t } = useTranslation();
    const origGoal = profile?.goal ?? null;
    const origLevel = profile?.level ?? null;

    const [goal, setGoal] = useState<Goal>(origGoal);
    const [level, setLevel] = useState<Level>(origLevel);

    const hasChanges = goal !== origGoal || level !== origLevel;

    function reset() {
        setGoal(origGoal);
        setLevel(origLevel);
    }

    return (
        <EditableSection
            icon={<Target className="w-4 h-4" />}
            label={t("profile.goalAndLevel")}
            summary={
                <div className="flex gap-3">
                    <Chip label={goal ? t(i18nKeyFor(GOAL_OPTIONS, goal)) : "—"} color="#39ff14" />
                    <Chip label={level ? t(i18nKeyFor(LEVEL_OPTIONS, level)) : "—"} color="#a855f7" />
                </div>
            }
            getPayload={() => ({ goal, level })}
            hasChanges={hasChanges}
            onReset={reset}
        >
            <div>
                <p className="text-xs text-white/40 mb-2">{t("profile.primaryGoal")}</p>
                <div className="grid grid-cols-1 gap-2">
                    {GOAL_OPTIONS.map((opt) => (
                        <OptionPill
                            key={opt.value}
                            emoji={opt.emoji}
                            label={t(opt.i18nKey)}
                            selected={goal === opt.value}
                            onSelect={() => setGoal(opt.value)}
                        />
                    ))}
                </div>
            </div>
            <div>
                <p className="text-xs text-white/40 mb-2">{t("profile.experienceLevel")}</p>
                <div className="grid grid-cols-1 gap-2">
                    {LEVEL_OPTIONS.map((opt) => (
                        <OptionPill
                            key={opt.value}
                            emoji={opt.emoji}
                            label={t(opt.i18nKey)}
                            selected={level === opt.value}
                            onSelect={() => setLevel(opt.value)}
                        />
                    ))}
                </div>
            </div>
        </EditableSection>
    );
}

// ── Section: Equipment ─────────────────────────────────────────────────────────

function EquipmentSection({ profile }: { profile: Profile | null }) {
    const { t } = useTranslation();
    const origEquipment = profile?.equipment ?? null;
    const [equipment, setEquipment] = useState<Equipment>(origEquipment);

    const hasChanges = equipment !== origEquipment;

    return (
        <EditableSection
            icon={<Dumbbell className="w-4 h-4" />}
            label={t("profile.equipment")}
            summary={<Chip label={equipment ? t(i18nKeyFor(EQUIPMENT_OPTIONS, equipment)) : "—"} color="#00d4ff" />}
            getPayload={() => ({ equipment })}
            hasChanges={hasChanges}
            onReset={() => setEquipment(origEquipment)}
        >
            <div className="grid grid-cols-1 gap-2">
                {EQUIPMENT_OPTIONS.map((opt) => (
                    <OptionPill
                        key={opt.value}
                        emoji={opt.emoji}
                        label={t(opt.i18nKey)}
                        selected={equipment === opt.value}
                        onSelect={() => setEquipment(opt.value)}
                    />
                ))}
            </div>
        </EditableSection>
    );
}

// ── Section: Body Metrics ──────────────────────────────────────────────────────

function BodySection({ profile }: { profile: Profile | null }) {
    const { t } = useTranslation();
    const origWeight = profile?.weight_kg ?? 0;
    const origHeight = profile?.height_cm ?? 0;

    const [weight, setWeight] = useState(origWeight);
    const [height, setHeight] = useState(origHeight);

    const hasChanges = weight !== origWeight || height !== origHeight;

    function reset() {
        setWeight(origWeight);
        setHeight(origHeight);
    }

    return (
        <EditableSection
            icon={<Scale className="w-4 h-4" />}
            label={t("profile.bodyMetrics")}
            summary={
                <div className="flex gap-4">
                    <MetricChip value={weight > 0 ? `${weight} kg` : "—"} label={t("profile.weight")} />
                    <MetricChip value={height > 0 ? `${height} cm` : "—"} label={t("profile.height")} />
                </div>
            }
            getPayload={() => ({
                weight_kg: weight > 0 ? weight : null,
                height_cm: height > 0 ? height : null,
            })}
            hasChanges={hasChanges}
            onReset={reset}
        >
            <ProfileSlider label={t("profile.bodyWeight")} value={weight} unit="kg" min={30} max={200} color="#39ff14" onChange={setWeight} />
            <ProfileSlider label={t("profile.height")} value={height} unit="cm" min={100} max={220} color="#00d4ff" onChange={setHeight} />
        </EditableSection>
    );
}

// ── Section: Training Schedule ─────────────────────────────────────────────────

function ScheduleSection({ profile }: { profile: Profile | null }) {
    const { t } = useTranslation();
    const origDays = profile?.days_per_week ?? 4;
    const origMinutes = profile?.minutes_per_session ?? 45;

    const [days, setDays] = useState(origDays);
    const [minutes, setMinutes] = useState(origMinutes);

    const hasChanges = days !== origDays || minutes !== origMinutes;

    function reset() {
        setDays(origDays);
        setMinutes(origMinutes);
    }

    return (
        <EditableSection
            icon={<Calendar className="w-4 h-4" />}
            label={t("profile.trainingSchedule")}
            summary={
                <div className="flex gap-4">
                    <MetricChip value={`${days}×`} label={t("profile.daysWeek")} />
                    <MetricChip value={`${minutes} min`} label={t("profile.perSession")} />
                </div>
            }
            getPayload={() => ({ days_per_week: days, minutes_per_session: minutes })}
            hasChanges={hasChanges}
            onReset={reset}
        >
            <ProfileSlider label={t("profile.daysPerWeek")} value={days} unit="days" min={1} max={7} color="#a855f7" onChange={setDays} />
            <ProfileSlider label={t("profile.sessionDuration")} value={minutes} unit="min" min={15} max={120} step={5} color="#f97316" onChange={setMinutes} />
        </EditableSection>
    );
}

// ── Translated action buttons ──────────────────────────────────────────────────

/** Edit label shown on collapsed sections — uses i18n */
function EditLabel() {
    const { t } = useTranslation();
    return (
        <div className="flex items-center gap-1 text-xs text-white/25 group-hover:text-white/50 transition-colors">
            {t("profile.edit")} <ChevronRight className="w-3.5 h-3.5" />
        </div>
    );
}

/** Cancel button for inline edit panels — uses i18n */
function CancelButton({ onClick }: { onClick: () => void }) {
    const { t } = useTranslation();
    return (
        <button
            onClick={onClick}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/40 hover:text-white/70 transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
            {t("profile.cancel")}
        </button>
    );
}

/** Save button for inline edit panels — uses i18n */
function SaveButton({ onClick, saving, hasChanges }: { onClick: () => void; saving: boolean; hasChanges: boolean }) {
    const { t } = useTranslation();
    return (
        <button
            onClick={onClick}
            disabled={saving || !hasChanges}
            className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200"
            style={{
                background: hasChanges ? "#39ff14" : "rgba(57,255,20,0.10)",
                color: hasChanges ? "#000" : "rgba(57,255,20,0.35)",
                cursor: hasChanges ? "pointer" : "not-allowed",
            }}
        >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> {t("profile.save")}</>}
        </button>
    );
}

// ── Micro-components ───────────────────────────────────────────────────────────

/** Small colored pill for read-view summaries */
function Chip({ label, color }: { label: string; color: string }) {
    return (
        <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
        >
            {label}
        </span>
    );
}

/** Numeric metric for read-view */
function MetricChip({ value, label }: { value: string; label: string }) {
    return (
        <div>
            <p className="text-base font-bold text-white">{value}</p>
            <p className="text-xs text-white/35">{label}</p>
        </div>
    );
}

/** Compact selectable pill for edit mode */
function OptionPill({
    emoji, label, selected, onSelect,
}: {
    emoji: string; label: string; selected: boolean; onSelect: () => void;
}) {
    return (
        <button
            onClick={onSelect}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
            style={{
                background: selected ? "rgba(57,255,20,0.08)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${selected ? "#39ff14" : "rgba(255,255,255,0.06)"}`,
            }}
        >
            <span className="text-lg">{emoji}</span>
            <span className="text-sm text-white font-medium">{label}</span>
            {selected && (
                <div
                    className="ml-auto w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: "#39ff14" }}
                >
                    <Check className="w-2.5 h-2.5 text-black" />
                </div>
            )}
        </button>
    );
}

/** Editable text input with label */
function TextInput({
    label, value, onChange, placeholder,
}: {
    label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
    return (
        <div>
            <p className="text-xs text-white/40 mb-1.5">{label}</p>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-transparent text-white text-sm outline-none rounded-xl px-3 py-3 placeholder:text-white/20"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
        </div>
    );
}

/** shadcn Slider styled for the profile edit panels */
function ProfileSlider({
    label, value, unit, min, max, step = 1, color, onChange,
}: {
    label: string; value: number; unit: string;
    min: number; max: number; step?: number;
    color: string; onChange: (v: number) => void;
}) {
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-white/40">{label}</p>
                <p className="text-sm font-bold tabular-nums" style={{ color }}>
                    {value > 0 ? `${value} ${unit}` : "—"}
                </p>
            </div>
            <Slider
                min={min} max={max} step={step}
                value={[value]}
                onValueChange={([v]) => onChange(v)}
                className="w-full"
                style={{ "--slider-color": color } as React.CSSProperties}
            />
            <div className="flex justify-between mt-1">
                <span className="text-xs text-white/20">{min}</span>
                <span className="text-xs text-white/20">{max}</span>
            </div>
        </div>
    );
}

// ── Language Section ───────────────────────────────────────────────────────────

/**
 * Sleek language toggle displayed at the top of the Profile sections.
 * Uses an animated pill selector between flag+label buttons.
 * Changing the language updates the i18n context instantly and
 * persists the choice to localStorage.
 */
function LanguageSection() {
    const { locale, setLocale, t } = useTranslation();

    const options: { value: Locale; flag: string; label: string }[] = [
        { value: "en", flag: "🇺🇸", label: "English" },
        { value: "es", flag: "🇪🇸", label: "Español" },
    ];

    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}
        >
            <SectionHeader icon={<Globe className="w-4 h-4" />} label={t("profile.language")} />

            <div className="px-4 py-4">
                <div
                    className="relative flex rounded-xl overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                    {/* Animated pill indicator */}
                    <motion.div
                        className="absolute top-1 bottom-1 rounded-lg z-0"
                        style={{
                            background: "rgba(57,255,20,0.12)",
                            border: "1px solid rgba(57,255,20,0.3)",
                            width: "calc(50% - 4px)",
                        }}
                        animate={{ x: locale === "en" ? 4 : "calc(100% + 4px)" }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />

                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setLocale(opt.value)}
                            className="relative z-10 flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors"
                            style={{ color: locale === opt.value ? "#39ff14" : "rgba(255,255,255,0.4)" }}
                        >
                            <span className="text-base">{opt.flag}</span>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
