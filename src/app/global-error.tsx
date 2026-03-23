"use client";

/**
 * @file app/global-error.tsx
 * Fatal error handler — shown when the root layout itself breaks.
 *
 * MUST include its own <html><body> since no layout is available.
 * Uses inline styles only — cannot depend on Tailwind, globals.css, etc.
 * Hardcodes both EN/ES strings since I18nProvider is unavailable.
 */

import { useEffect } from "react";

interface GlobalErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
    useEffect(() => {
        console.error("[GlobalError] Fatal error:", {
            message: error.message,
            digest: error.digest,
        });
    }, [error]);

    return (
        <html lang="es" className="dark">
            <body
                style={{
                    margin: 0,
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#000",
                    color: "#f0f0f0",
                    fontFamily:
                        "'Space Grotesk', system-ui, -apple-system, sans-serif",
                    textAlign: "center",
                    padding: "24px",
                }}
            >
                {/* Icon circle */}
                <div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: "rgba(57,255,20,0.08)",
                        border: "1px solid rgba(57,255,20,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 24,
                        fontSize: 28,
                    }}
                >
                    ⚠️
                </div>

                <h1
                    style={{
                        fontSize: 24,
                        fontWeight: 700,
                        margin: "0 0 8px",
                    }}
                >
                    Something went wrong / Algo salió mal
                </h1>
                <p
                    style={{
                        fontSize: 14,
                        color: "rgba(255,255,255,0.4)",
                        maxWidth: 360,
                        margin: "0 0 32px",
                        lineHeight: 1.5,
                    }}
                >
                    An unexpected error occurred. Please reload the page.
                    <br />
                    Ocurrió un error inesperado. Por favor recarga la página.
                </p>

                {/* Reload button */}
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "12px 24px",
                        borderRadius: 12,
                        border: "none",
                        background: "#39ff14",
                        color: "#000",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "filter 0.2s",
                    }}
                    onMouseOver={(e) =>
                        ((e.target as HTMLButtonElement).style.filter =
                            "brightness(1.1)")
                    }
                    onMouseOut={(e) =>
                        ((e.target as HTMLButtonElement).style.filter = "none")
                    }
                >
                    🔄 Reload page / Recargar página
                </button>
            </body>
        </html>
    );
}
