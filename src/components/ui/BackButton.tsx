"use client";

/**
 * @file components/ui/BackButton.tsx
 * Client-side back button that uses `router.back()` to navigate
 * to the previous history entry, instead of hardcoding a route.
 *
 * Designed for use in Server Components that need a history-aware
 * back button (since router.back() requires a client boundary).
 */
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
    /** The visible label text next to the arrow */
    label: string;
    /** Optional CSS class for the button container */
    className?: string;
    /** Optional inline styles */
    style?: React.CSSProperties;
}

export default function BackButton({ label, className, style }: BackButtonProps) {
    const router = useRouter();

    return (
        <button
            onClick={() => router.back()}
            className={
                className ??
                "flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
            }
            style={style ?? { color: "#39ff14" }}
        >
            <ArrowLeft className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );
}
