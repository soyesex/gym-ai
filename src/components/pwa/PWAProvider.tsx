"use client";

import { useEffect } from "react";

/**
 * Captures the global beforeinstallprompt event.
 * Because the event fires arbitrarily on page load, we must catch it
 * globally so that deep components (like WorkoutSummary's InstallPrompt)
 * can access it later and trigger it programmatically.
 */
export function PWAProvider() {
    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            (window as any).deferredPWAInstallPrompt = e;
        };
        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);
    return null;
}
