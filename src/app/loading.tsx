"use client";

/**
 * @file app/loading.tsx
 * Global loading state — shown during route transitions.
 *
 * Features:
 *   - Custom Lottie animation from /public/animations/gym-ai-loading.json
 *   - Rotating gym-themed messages every 3s with fade transitions (i18n)
 *   - Dark neon theme, centered layout
 */

import { useState, useEffect } from "react";
import Lottie from "lottie-react";
import { useTranslation } from "@/i18n";
import animationData from "../../public/animations/gym-ai-loading.json";

// ── Loading message i18n keys ─────────────────────────────────────────────────
const LOADING_MSG_KEYS = [
    "loading.msg1",
    "loading.msg2",
    "loading.msg3",
    "loading.msg4",
    "loading.msg5",
    "loading.msg6",
];

export default function Loading() {
    const { t } = useTranslation();

    // Rotating text message index
    const [msgIndex, setMsgIndex] = useState(
        () => Math.floor(Math.random() * LOADING_MSG_KEYS.length)
    );
    const [visible, setVisible] = useState(true);

    // Rotate messages every 3 seconds with fade
    useEffect(() => {
        const interval = setInterval(() => {
            // Fade out
            setVisible(false);

            // After fade-out (300ms), change message and fade in
            setTimeout(() => {
                setMsgIndex((prev) => (prev + 1) % LOADING_MSG_KEYS.length);
                setVisible(true);
            }, 300);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <main
            className="min-h-screen flex items-center justify-center"
            style={{ background: "transparent" }}
        >
            <div className="flex flex-col items-center gap-5">
                {/* Lottie animation */}
                <div style={{ width: 150, height: 150 }}>
                    <Lottie
                        animationData={animationData}
                        loop={true}
                        autoplay={true}
                        style={{ width: "100%", height: "100%" }}
                    />
                </div>

                {/* Rotating text with fade transition */}
                <p
                    className="text-lg font-display tracking-wide text-center transition-opacity duration-300"
                    style={{
                        color: "#39ff14",
                        opacity: visible ? 0.8 : 0,
                    }}
                >
                    {t(LOADING_MSG_KEYS[msgIndex])}
                </p>
            </div>
        </main>
    );
}
