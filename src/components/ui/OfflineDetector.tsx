"use client";

/**
 * @file components/ui/OfflineDetector.tsx
 * Detects network status and shows contextual banners.
 *
 * Offline: Fixed top banner with wifi-off icon + "No internet connection"
 * Reconnect: Green "Connection restored" banner (auto-hides after 3s)
 *            with a "Retry" button if the user went offline during an action.
 *
 * Uses padding-top push so it doesn't overlay the header.
 * i18n EN/ES via useTranslation.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "@/i18n";
import { WifiOff, Wifi, RotateCcw } from "lucide-react";

export function OfflineDetector() {
    const { t } = useTranslation();
    const [isOnline, setIsOnline] = useState(true);
    const [showReconnected, setShowReconnected] = useState(false);
    const [wasOffline, setWasOffline] = useState(false);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleOffline = useCallback(() => {
        setIsOnline(false);
        setWasOffline(true);
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
    }, []);

    const handleOnline = useCallback(() => {
        setIsOnline(true);
        if (wasOffline) {
            setShowReconnected(true);
            hideTimerRef.current = setTimeout(() => {
                setShowReconnected(false);
                setWasOffline(false);
            }, 3000);
        }
    }, [wasOffline]);

    useEffect(() => {
        // Set initial state
        setIsOnline(navigator.onLine);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, [handleOnline, handleOffline]);

    // Nothing to show
    if (isOnline && !showReconnected) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
            }}
        >
            {/* ── Offline Banner ─────────────────────────────────────────── */}
            {!isOnline && (
                <div
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold"
                    style={{
                        background: "rgba(239,68,68,0.9)",
                        color: "#fff",
                        backdropFilter: "blur(8px)",
                    }}
                >
                    <WifiOff className="w-4 h-4" />
                    {t("error.offline")}
                </div>
            )}

            {/* ── Reconnected Banner ─────────────────────────────────────── */}
            {isOnline && showReconnected && (
                <div
                    className="flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-semibold"
                    style={{
                        background: "rgba(57,255,20,0.9)",
                        color: "#000",
                        backdropFilter: "blur(8px)",
                    }}
                >
                    <Wifi className="w-4 h-4" />
                    {t("error.backOnline")}

                    {/* Retry button — useful if user was mid-action */}
                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer"
                        style={{
                            background: "rgba(0,0,0,0.2)",
                            color: "#000",
                        }}
                    >
                        <RotateCcw className="w-3 h-3" />
                        {t("error.retryAction")}
                    </button>
                </div>
            )}
        </div>
    );
}
