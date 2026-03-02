"use client";

/**
 * @file components/home/WorkoutCard.tsx
 * Displays a single exercise from the database as a workout module card.
 *
 * The card now accepts a `Tables<"exercises">` row directly, eliminating
 * the hardcoded props. Image is generated from a curated Unsplash mapping
 * keyed by `primary_muscle` until the `ai_thumbnail_url` field is populated.
 */
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Zap, Play } from "lucide-react";
import Image from "next/image";
import type { Tables } from "@/lib/supabase/database.types";

// ---------------------------------------------------------------------------
// Muscle → curated Unsplash image mapping (fallback until AI thumbnails exist)
// ---------------------------------------------------------------------------
const MUSCLE_IMAGES: Record<string, string> = {
    chest: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80",
    lats: "https://images.unsplash.com/photo-1616279969856-759f316a5ac1?w=400&q=80",
    traps: "https://images.unsplash.com/photo-1581009137042-c552e485697a?w=400&q=80",
    shoulders: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=80",
    triceps: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&q=80",
    biceps: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&q=80",
    abs: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
    quads: "https://images.unsplash.com/photo-1534362090813-cd7c3f3a145c?w=400&q=80",
    hamstrings: "https://images.unsplash.com/photo-1534362090813-cd7c3f3a145c?w=400&q=80",
    glutes: "https://images.unsplash.com/photo-1534362090813-cd7c3f3a145c?w=400&q=80",
    calves: "https://images.unsplash.com/photo-1534362090813-cd7c3f3a145c?w=400&q=80",
    default: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&q=80",
};

// Estimated duration by difficulty — used as a UI hint until workouts are real
const DIFFICULTY_DURATION: Record<string, string> = {
    beginner: "30 min",
    intermediate: "45 min",
    advanced: "60 min",
};

// Estimated calorie burn by difficulty
const DIFFICULTY_CALORIES: Record<string, number> = {
    beginner: 220,
    intermediate: 340,
    advanced: 480,
};

// Human-readable muscle labels
const MUSCLE_LABELS: Record<string, string> = {
    chest: "Chest", lats: "Back", traps: "Traps", shoulders: "Shoulders",
    triceps: "Triceps", biceps: "Biceps", forearms: "Forearms",
    obliques: "Obliques", abs: "Core", lower_back: "Lower Back",
    glutes: "Glutes", quads: "Quads", hamstrings: "Hamstrings",
    calves: "Calves", cardio_system: "Cardio",
};

// ---------------------------------------------------------------------------

interface WorkoutCardProps {
    /** A full row from the `exercises` table */
    exercise: Tables<"exercises">;
    /** Used to stagger the entry animation */
    index?: number;
}

export default function WorkoutCard({ exercise, index = 0 }: WorkoutCardProps) {
    const imageUrl =
        exercise.ai_thumbnail_url ??
        MUSCLE_IMAGES[exercise.primary_muscle] ??
        MUSCLE_IMAGES.default;

    const duration = DIFFICULTY_DURATION[exercise.difficulty ?? "beginner"];
    const calories = DIFFICULTY_CALORIES[exercise.difficulty ?? "beginner"];
    const muscleLabel = MUSCLE_LABELS[exercise.primary_muscle] ?? exercise.primary_muscle;

    // Module label uses mechanic + ordinal index for a "module" feel
    const moduleLabel = `Module ${String(index + 1).padStart(2, "0")} / ${muscleLabel}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.12, duration: 0.4 }}
            whileHover={{ scale: 1.015 }}
            className="relative flex-shrink-0 w-52 rounded-2xl overflow-hidden cursor-pointer group"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
            {/* Grayscale image with dark gradient overlay */}
            <div className="relative h-64 w-full">
                <Image
                    src={imageUrl}
                    alt={exercise.name}
                    fill
                    // CSS filter: grayscale gives the editorial, neon-on-dark look
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    style={{ filter: "grayscale(100%) contrast(1.05)" }}
                    sizes="208px"
                />
                {/* Heavy bottom gradient so text is always legible */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />
            </div>

            {/* Content overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-4">
                {/* Top — module label */}
                <div>
                    <span
                        className="text-[9px] font-semibold tracking-[0.2em] uppercase"
                        style={{ color: "#39ff14" }}
                    >
                        {moduleLabel}
                    </span>
                </div>

                {/* Bottom content */}
                <div className="space-y-2.5">
                    <Badge
                        variant="outline"
                        className="text-[9px] tracking-wider border-white/15 text-white/50 bg-transparent capitalize"
                    >
                        {exercise.mechanic ?? "compound"}
                    </Badge>

                    <h3 className="text-white font-semibold text-sm leading-snug">
                        {exercise.name}
                    </h3>

                    <div className="flex items-center gap-3 text-white/40 text-[11px]">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {duration}
                        </span>
                        <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" style={{ color: "#39ff14" }} />
                            {calories} kcal
                        </span>
                    </div>

                    {/* Ghost button that fills neon on hover */}
                    <Button
                        size="sm"
                        className="w-full text-[11px] font-semibold tracking-widest rounded-xl border transition-all duration-300 bg-transparent hover:bg-[#39ff14] hover:text-black hover:border-[#39ff14]"
                        style={{
                            borderColor: "rgba(57,255,20,0.4)",
                            color: "#39ff14",
                        }}
                    >
                        <Play className="w-3 h-3 mr-1 fill-current" />
                        START
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
