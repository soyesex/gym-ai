"use client";

/**
 * @file components/home/BiometricSlider.tsx
 * Interactive biometric telemetry sliders.
 *
 * Now accepts real profile data from the DB:
 * - `initialWeightKg` — seeds the Weight slider from profiles.weight_kg
 * - `initialHeightCm` — seeds the Height slider from profiles.height_cm
 *
 * Heart Rate and Recovery Score remain as simulated "live feed" metrics
 * until a real wearable integration exists.
 *
 * The slider values are local state — changes are visual only for now.
 * A future "Save Biometrics" button can persist them via a Server Action.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Heart, Zap, Activity, Weight, Ruler } from "lucide-react";

interface Metric {
    id: string;
    label: string;
    icon: React.ReactNode;
    value: number;
    unit: string;
    min: number;
    max: number;
    color: string;
    status: string;
}

interface BiometricSliderProps {
    /** Seeded from profiles.weight_kg — null if user hasn't set it yet */
    initialWeightKg: number | null;
    /** Seeded from profiles.height_cm — null if user hasn't set it yet */
    initialHeightCm: number | null;
}

/** Derive a status label based on where the value sits in the [min, max] range */
function deriveStatus(value: number, min: number, max: number): string {
    const pct = (value - min) / (max - min);
    if (pct < 0.33) return "Low";
    if (pct < 0.66) return "Optimal";
    return "High";
}

export default function BiometricSlider({
    initialWeightKg,
    initialHeightCm,
}: BiometricSliderProps) {
    // Build initial metrics array — profile values override defaults if present
    const buildDefaultMetrics = (): Metric[] => [
        {
            id: "heart-rate",
            label: "Heart Rate",
            icon: <Heart className="w-4 h-4" />,
            value: 72,
            unit: "BPM",
            min: 40,
            max: 200,
            color: "#ff4d6d",
            status: "Optimal",
        },
        {
            id: "weight",
            label: "Body Weight",
            icon: <Weight className="w-4 h-4" />,
            // Use real DB value if available, otherwise sensible default
            value: initialWeightKg ?? 75,
            unit: "kg",
            min: 30,
            max: 200,
            color: "#39ff14",
            status: deriveStatus(initialWeightKg ?? 75, 30, 200),
        },
        {
            id: "height",
            label: "Height",
            icon: <Ruler className="w-4 h-4" />,
            value: initialHeightCm ?? 170,
            unit: "cm",
            min: 100,
            max: 220,
            color: "#00d4ff",
            status: deriveStatus(initialHeightCm ?? 170, 100, 220),
        },
        {
            id: "recovery",
            label: "Recovery Score",
            icon: <Activity className="w-4 h-4" />,
            value: 82,
            unit: "%",
            min: 0,
            max: 100,
            color: "#a855f7",
            status: "Good",
        },
        {
            id: "strain",
            label: "Strain Index",
            icon: <Zap className="w-4 h-4" />,
            value: 65,
            unit: "%",
            min: 0,
            max: 100,
            color: "#f97316",
            status: "High",
        },
    ];

    const [metrics, setMetrics] = useState<Metric[]>(buildDefaultMetrics);

    function updateMetric(id: string, newValue: number[]) {
        setMetrics((prev) =>
            prev.map((m) => {
                if (m.id !== id) return m;
                const updated = { ...m, value: newValue[0] };
                // Re-derive the status label for range-based metrics
                if (m.id !== "heart-rate") {
                    updated.status = deriveStatus(newValue[0], m.min, m.max);
                }
                return updated;
            })
        );
    }

    return (
        <div className="space-y-4">
            {metrics.map((metric, i) => (
                <motion.div
                    key={metric.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    className="rounded-xl p-4"
                    style={{
                        background: "rgba(255,255,255,0.03)",
                        border: `1px solid ${metric.color}22`,
                    }}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span style={{ color: metric.color }}>{metric.icon}</span>
                            <span className="text-sm font-medium text-white/80">{metric.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span
                                className="text-xl font-bold tabular-nums"
                                style={{ color: metric.color }}
                            >
                                {metric.value}
                            </span>
                            <span className="text-xs text-white/40">{metric.unit}</span>
                            <Badge
                                variant="outline"
                                className="text-xs border-none"
                                style={{
                                    backgroundColor: `${metric.color}22`,
                                    color: metric.color,
                                }}
                            >
                                {metric.status}
                            </Badge>
                        </div>
                    </div>

                    <div className="relative">
                        <Slider
                            min={metric.min}
                            max={metric.max}
                            step={1}
                            value={[metric.value]}
                            onValueChange={(val) => updateMetric(metric.id, val)}
                            className="w-full"
                            style={{ "--slider-color": metric.color } as React.CSSProperties}
                        />
                        <div className="flex justify-between mt-1">
                            <span className="text-xs text-white/25">{metric.min}</span>
                            <span className="text-xs text-white/25">{metric.max}</span>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
