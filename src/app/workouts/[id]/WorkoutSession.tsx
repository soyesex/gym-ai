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
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Plus, Trash2, Search, X,
    CheckCircle2, Loader2, ChevronDown,
} from "lucide-react";
import { addSet, updateSet, deleteSet, finishWorkout } from "@/app/workouts/actions";
import BottomNav from "@/components/home/BottomNav";
import type { WorkoutWithSets, SetWithExercise } from "@/lib/supabase/queries";
import type { Tables } from "@/lib/supabase/database.types";
import { useTranslation, getExerciseName } from "@/i18n";

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
    const { t } = useTranslation();

    // Hydrate local set list from server data
    const [sets, setSets] = useState<LocalSet[]>(
        () => workout.sets as unknown as LocalSet[]
    );

    const [showPicker, setShowPicker] = useState(false);
    const [showFinish, setShowFinish] = useState(false);
    const [finishing, setFinishing] = useState(false);
    const [difficulty, setDifficulty] = useState(7);
    const [searchQuery, setSearchQuery] = useState("");

    const elapsed = useElapsedSeconds(workout.started_at);
    const grouped = groupSets(sets);

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
            // Roll back on failure
            setSets((prev) => prev.filter((s) => s.id !== tempId));
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
        // Persist on input blur — fire-and-forget (no loading state needed)
        await updateSet(setId, workout.id, { [field]: value });
    }

    async function handleDeleteSet(setId: string) {
        setSets((prev) => prev.filter((s) => s.id !== setId));
        await deleteSet(setId, workout.id);
    }

    // ── Finish ────────────────────────────────────────────────────────────────

    async function handleFinish() {
        setFinishing(true);
        const result = await finishWorkout(workout.id, elapsed, difficulty);
        setFinishing(false);
        if (result.success) {
            router.push("/log");
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
                <button
                    onClick={() => router.push("/log")}
                    className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 mb-5 transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> {t("session.workouts")}
                </button>

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white leading-tight">
                            {workout.name}
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
             * The button is fixed directly — no wrapper needed.
             */}
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
                <p className="text-sm font-bold text-white flex-1">{displayName}</p>
                <span
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                        background: "rgba(57,255,20,0.08)",
                        color: "#39ff14",
                        border: "1px solid rgba(57,255,20,0.2)",
                    }}
                >
                    {(group.exercise.primary_muscle ?? "unknown").replaceAll("_", " ")}
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
                                            {(ex.primary_muscle ?? "unknown").replaceAll("_", " ")} ·{" "}
                                            {ex.mechanic ?? "—"} ·{" "}
                                            {ex.equipment}
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
                                        {ex.difficulty}
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
