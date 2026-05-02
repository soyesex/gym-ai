"use client";

/**
 * @file app/workouts/[id]/WorkoutSession.tsx
 * Live workout tracker — Client Component.
 *
 * Features:
 *  - Elapsed timer (useEffect / setInterval)
 *  - Exercise picker (search from library, bottom sheet style)
 *  - Set logging per exercise: weight × reps inline inputs
 *  - Add / delete sets; values saved on blur via Server Actions
 *  - Finish modal: optional difficulty rating → finishWorkout()
 *
 * Data flow:
 *  Server Component (page.tsx) fetches workout+sets and exercises,
 *  passes them here as props. Local state mirrors the DB for instant UI,
 *  while Server Actions keep the DB in sync in the background.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Plus, Trash2, Search, X,
    CheckCircle2, Loader2, ChevronDown,
} from "lucide-react";
import { addSet, updateSet, deleteSet, finishWorkout, cancelWorkoutSession } from "@/app/workouts/actions";
import BottomNav from "@/components/home/BottomNav";
import type { WorkoutWithSets, SetWithExercise } from "@/lib/supabase/queries";
import type { Tables } from "@/lib/supabase/database.types";
import { useTranslation, getExerciseName, getWorkoutName } from "@/i18n";

type Exercise = Tables<"exercises">;

// ── Types ──────────────────────────────────────────────────────────────────────

interface WorkoutSessionProps {
    workout: WorkoutWithSets;
    exercises: Exercise[];
}

/**
 * A local set row — mirrors workout_sets but with a `pending` flag for
 * optimistic inserts that haven't received their DB id yet.
 */
interface LocalSet extends Omit<SetWithExercise, "exercises"> {
    exercises: { id: string; name: string; name_es?: string | null; primary_muscle: string };
    pending?: boolean; // true while addSet() is in flight
}

// Group sets by exercise_id for rendering
type GroupedSets = Map<string, { exercise: LocalSet["exercises"]; sets: LocalSet[] }>;

function groupSets(sets: LocalSet[]): GroupedSets {
    const map: GroupedSets = new Map();
    for (const s of sets) {
        const key = s.exercise_id;
        if (!map.has(key)) {
            map.set(key, { exercise: s.exercises, sets: [] });
        }
        map.get(key)!.sets.push(s);
    }
    return map;
}

// ── Elapsed timer ──────────────────────────────────────────────────────────────

function useElapsedSeconds(startIso: string | null): number {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const start = startIso ? new Date(startIso).getTime() : Date.now();
        const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [startIso]);

    return elapsed;
}

function formatElapsed(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function WorkoutSession({ workout, exercises }: WorkoutSessionProps) {
    const router = useRouter();
    const { t, locale } = useTranslation();

    // Hydrate local set list from server data
    const [sets, setSets] = useState<LocalSet[]>(
        () => workout.sets as unknown as LocalSet[]
    );

    // ── Resilient Data Sync (Fixes memory loss on Back button) ──────────────
    // 1. Force a background refresh on mount to invalidate client cache
    useEffect(() => {
        router.refresh();
    }, [router]);

    // 2. Safely merge fresh server data into local state
    // This avoids wiping out optimistic sets or active typing (which caused BUG-02)
    useEffect(() => {
        setSets((prev) => {
            const next = [...prev];
            let changed = false;
            
            for (const serverSet of (workout.sets as unknown as LocalSet[])) {
                const localIdx = next.findIndex((s) => s.id === serverSet.id);
                if (localIdx === -1) {
                    // New set from server
                    next.push(serverSet);
                    changed = true;
                } else {
                    const localSet = next[localIdx];
                    // Only merge if the DB is un-synced AND we aren't waiting on a pending save
                    if (!localSet.pending && (localSet.weight_kg !== serverSet.weight_kg || localSet.reps !== serverSet.reps)) {
                        next[localIdx] = { ...localSet, weight_kg: serverSet.weight_kg, reps: serverSet.reps };
                        changed = true;
                    }
                }
            }
            return changed ? next.sort((a,b) => a.set_order - b.set_order) : prev;
        });
    }, [workout.sets]);

    const [showPicker, setShowPicker] = useState(false);
    const [showFinish, setShowFinish] = useState(false);
    const [finishing, setFinishing] = useState(false);
    const [difficulty, setDifficulty] = useState(7);
    const [searchQuery, setSearchQuery] = useState("");
    const [errorToast, setErrorToast] = useState<string | null>(null);
    const [show90MinNotice, setShow90MinNotice] = useState(false);
    const [dismissed90Min, setDismissed90Min] = useState(false);
    const [showAutoSavedToast, setShowAutoSavedToast] = useState(false);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const elapsed = useElapsedSeconds(workout.started_at);
    const grouped = groupSets(sets);

    // ── Auto-save toast detection on load ──────────────────────────────────────
    useEffect(() => {
        // If the session is loaded, the user wasn't active, and the timer is > 4h
        // but status is somehow still active (meaning the server job hasn't run yet
        // or just did and we caught it midway), we show a toast.
        // Actually, the server cron job handles the zombie sessions. 
        // We just need to check if we were redirected back to the log/home and the session is gone,
        // but here we are in an active session. If it's been > 4 hours, warn them it's about to be saved.
        if (elapsed >= 14400 && !showAutoSavedToast) {
            setShowAutoSavedToast(true);
            setTimeout(() => setShowAutoSavedToast(false), 8000);
        }
    }, []); // Run once on mount

    // ── 90 Minute Notifier ──────────────────────────────────────────────────
    useEffect(() => {
        if (elapsed >= 5400 && !dismissed90Min && !show90MinNotice) {
            setShow90MinNotice(true);
        }
    }, [elapsed, dismissed90Min, show90MinNotice]);

    // ── Error toast helper ────────────────────────────────────────────────────
    const showError = useCallback((key: string) => {
        setErrorToast(key);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setErrorToast(null), 5000);
    }, []);

    useEffect(() => {
        return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
    }, []);

    // ── Exercise picker logic ─────────────────────────────────────────────────

    const filteredExercises = exercises.filter((e) => {
        const q = searchQuery.toLowerCase();
        return e.name.toLowerCase().includes(q) || (e.name_es?.toLowerCase().includes(q) ?? false);
    });

    async function handlePickExercise(exercise: Exercise) {
        setShowPicker(false);
        setSearchQuery("");

        // Count existing sets for this exercise to determine set_order
        const existing = sets.filter((s) => s.exercise_id === exercise.id);
        const setOrder = existing.length + 1;

        // Optimistic local set with a placeholder id
        const tempId = `temp-${Date.now()}`;
        const optimistic: LocalSet = {
            id: tempId,
            workout_id: workout.id,
            exercise_id: exercise.id,
            set_order: setOrder,
            weight_kg: 0,
            reps: null,
            rpe: null,
            rest_seconds: 60,
            is_warmup: false,
            created_at: new Date().toISOString(),
            exercises: {
                id: exercise.id,
                name: exercise.name,
                name_es: exercise.name_es,
                primary_muscle: exercise.primary_muscle,
            },
            pending: true,
        };

        setSets((prev) => [...prev, optimistic]);

        try {
            const result = await addSet(workout.id, exercise.id, {
                weight_kg: 0,
                reps: 0,
                set_order: setOrder,
            });

            if (result.success) {
                // Replace temp row with real DB id
                setSets((prev) =>
                    prev.map((s) =>
                        s.id === tempId ? { ...s, id: result.data.id, pending: false } : s
                    )
                );
            } else {
                // DB error — roll back but show message
                setSets((prev) => prev.filter((s) => s.id !== tempId));
                showError("error.saveFailed");
            }
        } catch (err) {
            // Network failure — keep optimistic row visible (data preserved)
            // but mark as pending so user knows it hasn't saved
            console.error("[handlePickExercise] Network error:", err);
            showError("error.saveFailed");
        }
    }

    // ── Set CRUD ──────────────────────────────────────────────────────────────

    function handleSetChange(
        setId: string,
        field: "weight_kg" | "reps",
        value: number
    ) {
        // Update local state immediately for responsive UX
        setSets((prev) =>
            prev.map((s) => (s.id === setId ? { ...s, [field]: value } : s))
        );
    }

    async function handleSetBlur(
        setId: string,
        field: "weight_kg" | "reps",
        value: number
    ) {
        try {
            // Persist on input blur — fire-and-forget (no loading state needed)
            await updateSet(setId, workout.id, { [field]: value });
        } catch (err) {
            // Network failure — data is safe in local state, will need retry
            console.error("[handleSetBlur] Network error:", err);
            showError("error.saveFailed");
        }
    }

    async function handleDeleteSet(setId: string) {
        // Optimistically remove from UI
        const previousSets = sets;
        setSets((prev) => prev.filter((s) => s.id !== setId));
        try {
            await deleteSet(setId, workout.id);
        } catch (err) {
            // Network failure — restore the set
            console.error("[handleDeleteSet] Network error:", err);
            setSets(previousSets);
            showError("error.deleteFailed");
        }
    }

    // ── Finish ────────────────────────────────────────────────────────────────

    async function handleFinish() {
        setFinishing(true);
        try {
            const result = await finishWorkout(workout.id, elapsed, difficulty);
            setFinishing(false);
            if (result.success) {
                router.push("/log");
            } else {
                showError("error.finishFailed");
            }
        } catch (err) {
            setFinishing(false);
            console.error("[handleFinish] Network error:", err);
            showError("error.finishFailed");
        }
    }

    // ── Cancel ────────────────────────────────────────────────────────────────

    async function handleCancel() {
        const confirmed = window.confirm(t("session.cancelConfirmation") ?? "Are you sure you want to cancel this workout? All progress will be lost.");
        if (!confirmed) return;

        try {
            const result = await cancelWorkoutSession(workout.id);
            if (result.success) {
                router.back();
            } else {
                showError("error.cancelFailed");
            }
        } catch (err) {
            console.error("[handleCancel] Network error:", err);
            showError("error.cancelFailed");
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div
            className="min-h-screen pb-28"
            style={{ background: "#000", maxWidth: "480px", margin: "0 auto" }}
        >
            {/* ── Header ── */}
            <div className="px-5 pt-12 pb-4">
                <div className="flex items-center justify-between mb-5">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> {t("session.back")}
                    </button>

                    <button
                        onClick={handleCancel}
                        className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-400 transition-colors font-semibold"
                    >
                        <Trash2 className="w-3.5 h-3.5" /> {t("session.cancelWorkout") ?? "Cancel Workout"}
                    </button>
                </div>

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white leading-tight">
                            {getWorkoutName(workout, locale)}
                        </h1>
                        {/* Elapsed timer */}
                        <p
                            className="text-3xl font-mono font-bold mt-1 tabular-nums"
                            style={{ color: "#39ff14", letterSpacing: "0.05em" }}
                        >
                            {formatElapsed(elapsed)}
                        </p>
                    </div>

                    {/* Finish button */}
                    <button
                        onClick={() => setShowFinish(true)}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold"
                        style={{ background: "rgba(57,255,20,0.1)", color: "#39ff14", border: "1px solid rgba(57,255,20,0.2)" }}
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        {t("session.finish")}
                    </button>
                </div>
            </div>

            {/* ── Exercise groups ── */}
            <div className="px-5 space-y-4">
                {grouped.size === 0 && (
                    <div
                        className="rounded-2xl py-12 flex flex-col items-center gap-3"
                        style={{ border: "1px dashed rgba(255,255,255,0.08)" }}
                    >
                        <p className="text-sm text-white/30">{t("session.noExercisesYet")}</p>
                        <button
                            onClick={() => setShowPicker(true)}
                            className="text-xs font-semibold px-4 py-2 rounded-xl"
                            style={{ background: "rgba(57,255,20,0.08)", color: "#39ff14" }}
                        >
                            {t("session.addFirstExercise")}
                        </button>
                    </div>
                )}

                {[...grouped.entries()].map(([exerciseId, group]) => (
                    <ExerciseGroup
                        key={exerciseId}
                        group={group}
                        onChange={handleSetChange}
                        onBlur={handleSetBlur}
                        onDelete={handleDeleteSet}
                        onAddSet={async () => {
                            // Simulate picking the same exercise again — add a new set
                            const ex = exercises.find((e) => e.id === exerciseId);
                            if (ex) await handlePickExercise(ex);
                        }}
                    />
                ))}
            </div>

            {/* ── Add Exercise FAB ── */}
            {/*
             * Centered with left-1/2 + -translate-x-1/2 (margin:auto has no
             * effect on position:fixed elements).
             * bottom-28 clears the BottomNav bar (~64 px tall).
             * Hidden when no exercises exist — the empty-state button is shown instead.
             */}
            {grouped.size > 0 && (
                <button
                    onClick={() => setShowPicker(true)}
                    className="fixed bottom-28 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-bold shadow-2xl"
                    style={{
                        background: "#39ff14",
                        color: "#000",
                        boxShadow: "0 0 24px rgba(57,255,20,0.4)",
                    }}
                >
                    <Plus className="w-4 h-4" /> {t("session.addExercise")}
                </button>
            )}

            {/* ── Exercise Picker Sheet ── */}
            <ExercisePicker
                open={showPicker}
                exercises={filteredExercises}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onClose={() => { setShowPicker(false); setSearchQuery(""); }}
                onSelect={handlePickExercise}
            />

            {/* ── Finish Modal ── */}
            <FinishModal
                open={showFinish}
                elapsed={elapsed}
                difficulty={difficulty}
                finishing={finishing}
                onDifficultyChange={setDifficulty}
                onCancel={() => setShowFinish(false)}
                onConfirm={handleFinish}
            />

            {/* ── 90 Min Warning Modal ── */}
            <AnimatePresence>
                {show90MinNotice && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-sm rounded-[32px] p-6 text-center shadow-2xl"
                            style={{
                                background: "rgba(30,30,30,0.85)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                backdropFilter: "blur(24px)",
                            }}
                        >
                            <h2 className="text-xl font-extrabold text-white mb-2">
                                {t("session.softCheck90Title")}
                            </h2>
                            <p className="text-sm text-white/60 mb-6 leading-relaxed">
                                {t("session.softCheck90Desc")}
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        setShow90MinNotice(false);
                                        setDismissed90Min(true);
                                        setShowFinish(true);
                                    }}
                                    className="w-full py-4 rounded-2xl font-bold text-sm transition-all hover:brightness-110"
                                    style={{ background: "#39ff14", color: "#000" }}
                                >
                                    {t("session.wrapUp")}
                                </button>
                                <button
                                    onClick={() => {
                                        setShow90MinNotice(false);
                                        setDismissed90Min(true);
                                    }}
                                    className="w-full py-4 rounded-2xl font-bold text-sm bg-white/5 text-white transition-all hover:bg-white/10"
                                >
                                    {t("session.keepGoing")}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Toast for auto-save / timeout */}
                {showAutoSavedToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-24 left-4 right-4 z-50 flex flex-col gap-1 px-5 py-4 rounded-2xl shadow-2xl"
                        style={{
                            background: "rgba(57,255,20,0.15)",
                            border: "1px solid rgba(57,255,20,0.3)",
                            backdropFilter: "blur(12px)",
                            maxWidth: 440,
                            margin: "0 auto",
                        }}
                    >
                        <p className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: "#39ff14" }} />
                            {t("session.autoSavedToast")}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Error Toast ── */}
            <AnimatePresence>
                {errorToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-20 left-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold"
                        style={{
                            background: "rgba(239,68,68,0.95)",
                            color: "#fff",
                            maxWidth: 440,
                            margin: "0 auto",
                            backdropFilter: "blur(8px)",
                            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
                        }}
                    >
                        <span className="flex-1">{t(errorToast)}</span>
                        <button
                            onClick={() => setErrorToast(null)}
                            className="text-white/70 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── BottomNav — always visible so user can navigate away */}
            <BottomNav />
        </div>
    );
}

// ── ExerciseGroup ─────────────────────────────────────────────────────────────

interface ExerciseGroupProps {
    group: { exercise: LocalSet["exercises"]; sets: LocalSet[] };
    onChange: (id: string, field: "weight_kg" | "reps", value: number) => void;
    onBlur: (id: string, field: "weight_kg" | "reps", value: number) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onAddSet: () => Promise<void>;
}

function ExerciseGroup({ group, onChange, onBlur, onDelete, onAddSet }: ExerciseGroupProps) {
    const { locale, t } = useTranslation();
    const displayName = getExerciseName(group.exercise, locale);

    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.06)", background: "#0a0a0a" }}
        >
            {/* Exercise header */}
            <div
                className="flex items-center gap-2 px-4 py-3 border-b"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
            >
                <span style={{ color: "#39ff14" }}>
                    <ChevronDown className="w-4 h-4" />
                </span>
                <Link 
                    href={`/exercises/${group.exercise.id}`}
                    className="text-sm font-bold text-white flex-1 hover:underline transition-colors"
                >
                    {displayName}
                </Link>
                <span
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                        background: "rgba(57,255,20,0.08)",
                        color: "#39ff14",
                        border: "1px solid rgba(57,255,20,0.2)",
                    }}
                >
                    {t(`muscles.${group.exercise.primary_muscle ?? "unknown"}`)}
                </span>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 px-4 py-2">
                <p className="text-[10px] text-white/25 font-medium text-center">#</p>
                <p className="text-[10px] text-white/25 font-medium text-center">{t("session.kg")}</p>
                <p className="text-[10px] text-white/25 font-medium text-center">{t("session.reps")}</p>
                <div />
            </div>

            {/* Set rows */}
            {group.sets.map((set, idx) => (
                <SetRow
                    key={set.id}
                    set={set}
                    index={idx + 1}
                    onChange={onChange}
                    onBlur={onBlur}
                    onDelete={onDelete}
                />
            ))}

            {/* Add set */}
            <button
                onClick={onAddSet}
                className="w-full py-3 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                style={{
                    color: "rgba(57,255,20,0.5)",
                    borderTop: "1px solid rgba(255,255,255,0.04)",
                }}
            >
                <Plus className="w-3 h-3" /> {t("session.addSet")}
            </button>
        </div>
    );
}

// ── SetRow ────────────────────────────────────────────────────────────────────

interface SetRowProps {
    set: LocalSet;
    index: number;
    onChange: (id: string, field: "weight_kg" | "reps", value: number) => void;
    onBlur: (id: string, field: "weight_kg" | "reps", value: number) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

function SetRow({ set, index, onChange, onBlur, onDelete }: SetRowProps) {
    const weight = Number(set.weight_kg ?? 0);
    const reps = set.reps ?? 0;

    return (
        <div
            className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 items-center px-4 py-2"
            style={{ opacity: set.pending ? 0.4 : 1, transition: "opacity 0.2s" }}
        >
            {/* Set number */}
            <p className="text-xs text-white/30 text-center font-mono">{index}</p>

            {/* Weight input */}
            <input
                type="number"
                inputMode="decimal"
                value={weight === 0 ? "" : weight}
                placeholder="0"
                min={0}
                onChange={(e) => onChange(set.id, "weight_kg", parseFloat(e.target.value) || 0)}
                onBlur={(e) => onBlur(set.id, "weight_kg", parseFloat(e.target.value) || 0)}
                disabled={set.pending}
                className="w-full text-center text-sm font-bold text-white outline-none rounded-lg py-2 tabular-nums"
                style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.07)",
                }}
            />

            {/* Reps input */}
            <input
                type="number"
                inputMode="numeric"
                value={reps === 0 ? "" : reps}
                placeholder="0"
                min={0}
                onChange={(e) => onChange(set.id, "reps", parseInt(e.target.value) || 0)}
                onBlur={(e) => onBlur(set.id, "reps", parseInt(e.target.value) || 0)}
                disabled={set.pending}
                className="w-full text-center text-sm font-bold text-white outline-none rounded-lg py-2 tabular-nums"
                style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.07)",
                }}
            />

            {/* Delete */}
            <button
                onClick={() => onDelete(set.id)}
                disabled={set.pending}
                className="flex items-center justify-center text-white/20 hover:text-red-400 transition-colors"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

// ── ExercisePicker ────────────────────────────────────────────────────────────

interface ExercisePickerProps {
    open: boolean;
    exercises: Exercise[];
    searchQuery: string;
    onSearchChange: (q: string) => void;
    onClose: () => void;
    onSelect: (e: Exercise) => Promise<void>;
}

function ExercisePicker({
    open, exercises, searchQuery, onSearchChange, onClose, onSelect,
}: ExercisePickerProps) {
    const { locale, t } = useTranslation();

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40"
                        style={{ background: "rgba(0,0,0,0.7)" }}
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", stiffness: 400, damping: 40 }}
                        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
                        style={{
                            background: "#0d0d0d",
                            border: "1px solid rgba(255,255,255,0.08)",
                            maxWidth: "480px",
                            margin: "0 auto",
                            maxHeight: "75vh",
                        }}
                    >
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full bg-white/20" />
                        </div>

                        {/* Search bar */}
                        <div className="px-4 pb-3">
                            <div
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                            >
                                <Search className="w-4 h-4 text-white/30" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    placeholder={t("session.searchExercises")}
                                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/25"
                                    // eslint-disable-next-line jsx-a11y/no-autofocus
                                    autoFocus
                                />
                                {searchQuery && (
                                    <button onClick={() => onSearchChange("")}>
                                        <X className="w-3.5 h-3.5 text-white/30 hover:text-white/60" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Exercise list */}
                        <div className="overflow-y-auto" style={{ maxHeight: "calc(75vh - 100px)" }}>
                            {exercises.map((ex) => (
                                <button
                                    key={ex.id}
                                    onClick={() => onSelect(ex)}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/5"
                                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">{getExerciseName(ex, locale)}</p>
                                        <p className="text-xs text-white/35 mt-0.5 capitalize">
                                            {t(`muscles.${ex.primary_muscle ?? "unknown"}`)} ·{" "}
                                            {ex.mechanic ? t(`mechanics.${ex.mechanic}`) : "—"} ·{" "}
                                            {t(`equipmentTypes.${ex.equipment}`)}
                                        </p>
                                    </div>
                                    <span
                                        className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                                        style={{
                                            background: "rgba(57,255,20,0.07)",
                                            color: "#39ff14",
                                            border: "1px solid rgba(57,255,20,0.2)",
                                        }}
                                    >
                                        {ex.difficulty ? t(`levels.${ex.difficulty}`) : ex.difficulty}
                                    </span>
                                </button>
                            ))}
                            {exercises.length === 0 && (
                                <p className="text-sm text-white/30 text-center py-8">
                                    {t("session.noExercisesMatch")} &quot;{searchQuery}&quot;
                                </p>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ── FinishModal ───────────────────────────────────────────────────────────────

interface FinishModalProps {
    open: boolean;
    elapsed: number;
    difficulty: number;
    finishing: boolean;
    onDifficultyChange: (d: number) => void;
    onCancel: () => void;
    onConfirm: () => void;
}

function FinishModal({
    open, elapsed, difficulty, finishing,
    onDifficultyChange, onCancel, onConfirm,
}: FinishModalProps) {
    const { t } = useTranslation();
    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="fixed inset-0 z-40"
                        style={{ background: "rgba(0,0,0,0.75)" }}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-x-5 z-50 rounded-3xl p-6"
                        style={{
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "#111",
                            border: "1px solid rgba(255,255,255,0.1)",
                            maxWidth: "440px",
                            margin: "0 auto",
                        }}
                    >
                        <h2 className="text-lg font-bold text-white mb-1">{t("session.wrapItUp")}</h2>
                        <p className="text-sm text-white/40 mb-6">
                            {t("session.sessionTime")} <strong className="text-white">{formatElapsed(elapsed)}</strong>
                        </p>

                        {/* Difficulty slider */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <p className="text-xs text-white/40">{t("session.howTough")}</p>
                                <p
                                    className="text-2xl font-bold tabular-nums"
                                    style={{ color: "#39ff14" }}
                                >
                                    {difficulty}<span className="text-sm text-white/30">/10</span>
                                </p>
                            </div>

                            <input
                                type="range"
                                min={1}
                                max={10}
                                value={difficulty}
                                onChange={(e) => onDifficultyChange(Number(e.target.value))}
                                className="w-full h-1.5 rounded-full appearance-none"
                                style={{
                                    background: `linear-gradient(to right, #39ff14 ${(difficulty - 1) * 11.1}%, rgba(255,255,255,0.1) ${(difficulty - 1) * 11.1}%)`,
                                    cursor: "pointer",
                                }}
                            />

                            <div className="flex justify-between mt-1">
                                <span className="text-[10px] text-white/20">{t("session.easy")}</span>
                                <span className="text-[10px] text-white/20">{t("session.maxEffort")}</span>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/40 hover:text-white/70 transition-colors"
                                style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                            >
                                {t("session.cancel")}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={finishing}
                                className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                                style={{ background: "#39ff14", color: "#000" }}
                            >
                                {finishing
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <><CheckCircle2 className="w-4 h-4" /> {t("session.finish")}</>}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
