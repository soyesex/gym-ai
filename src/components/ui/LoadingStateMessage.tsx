"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type ResolvedLoadingMessage, getRandomLoadingMessage } from "@/config/loading-messages";
import { useTranslation } from "@/i18n";

export default function LoadingStateMessage() {
    const { locale } = useTranslation();
    const [msg, setMsg] = useState<ResolvedLoadingMessage | null>(null);

    // Select message only on mount to avoid hydration mismatch (no SSR random value).
    // Re-runs when locale changes so messages switch language immediately.
    useEffect(() => {
        setMsg(getRandomLoadingMessage(locale));

        const interval = setInterval(() => {
            setMsg(getRandomLoadingMessage(locale));
        }, 4000);

        return () => clearInterval(interval);
    }, [locale]);

    if (!msg) return null;

    return (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center z-50 pointer-events-none px-6">
            <AnimatePresence mode="wait">
                <motion.div
                    key={msg.title + msg.description}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="flex flex-col items-center text-center py-4 px-6 rounded-2xl shadow-2xl"
                    style={{
                        background: "rgba(8, 8, 8, 0.92)",
                        backdropFilter: "blur(16px)",
                        border: "1px solid rgba(57, 255, 20, 0.12)",
                        boxShadow: "0 0 40px rgba(57, 255, 20, 0.06), 0 8px 32px rgba(0,0,0,0.6)",
                        maxWidth: "340px",
                        width: "100%",
                    }}
                >
                    {/* Neon dot + Title */}
                    <div className="flex items-center gap-2.5 mb-2">
                        <div
                            className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
                            style={{
                                background: "#39ff14",
                                boxShadow: "0 0 10px #39ff14, 0 0 20px rgba(57,255,20,0.3)",
                            }}
                        />
                        <h3
                            className="text-base font-bold uppercase tracking-[0.15em]"
                            style={{ color: "#39ff14" }}
                        >
                            {msg.title}
                        </h3>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-white/60 leading-relaxed font-medium max-w-[300px]">
                        {msg.description}
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
