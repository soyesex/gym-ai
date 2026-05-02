"use client";

/**
 * @file app/exercises/[id]/ExerciseChatFAB.tsx
 * floating action button + bottom-sheet chat drawer for exercise detail page.
 *
 * ── Behavior ────────────────────────────────────────────────────────────
 *   - FAB: circular 56px neon green button, bottom-right, above bottom nav
 *   - Sheet: 70vh slide-up panel, dark theme, stays open until X pressed
 *   - Streaming: appends Gemini text chunks as they arrive (no full-reload)
 *   - Auto-scroll: always scrolls to the last message
 *   - Keyboard: input stays above keyboard via CSS env(safe-area-inset-*)
 *   - History: kept in React state — cleared on page navigation (by design)
 *
 * ── Error states ────────────────────────────────────────────────────────
 *   - chat.rateLimit → amber warning message (no retry button)
 *   - chat.error / others → error bubble with retry option
 *   - Offline → specific offline message
 *
 * ── i18n ────────────────────────────────────────────────────────────────
 *   - Reads locale from I18nProvider context
 *   - All visible strings use t() lookup
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, AlertTriangle, RotateCcw, Wifi } from "lucide-react";
import { useTranslation } from "@/i18n";

// ── Types ────────────────────────────────────────────────────────────────────

type MessageRole = "user" | "assistant" | "error" | "system";

interface ChatMessage {
    id: string;
    role: MessageRole;
    text: string;
    errorKey?: string; // i18n key for error messages
    isStreaming?: boolean; // true while Gemini is still writing
}

interface Props {
    exerciseId: string;
    exerciseName: string; // display name (already locale-correct from server)
}

// ── Error sentinel ───────────────────────────────────────────────────────────

const ERROR_PREFIX = "\x00ERROR:";

// ── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ExerciseChatFAB({ exerciseId, exerciseName }: Props) {
    const { t, locale } = useTranslation();

    // UI state
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasOpened, setHasOpened] = useState(false); // track first open for welcome message

    // Chat history
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    // Refs
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    // ── Auto-scroll ──────────────────────────────────────────────────────────
    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // ── Focus input when sheet opens ─────────────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    // ── Show welcome message on first open ───────────────────────────────────
    const handleOpen = useCallback(() => {
        setIsOpen(true);
        if (!hasOpened) {
            setHasOpened(true);
            const welcomeText = t("exercise.chat.welcome").replace(
                "{exercise}",
                exerciseName
            );
            setMessages([
                {
                    id: uid(),
                    role: "assistant",
                    text: welcomeText,
                },
            ]);
        }
    }, [hasOpened, exerciseName, t]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        abortRef.current?.abort();
    }, []);

    // ── Send message ─────────────────────────────────────────────────────────
    const sendMessage = useCallback(async () => {
        const trimmed = inputValue.trim();
        if (!trimmed || isLoading) return;

        setInputValue("");
        setIsLoading(true);

        // Add user bubble immediately
        const userMsgId = uid();
        setMessages((prev) => [
            ...prev,
            { id: userMsgId, role: "user", text: trimmed },
        ]);

        // Add empty streaming assistant bubble
        const botMsgId = uid();
        setMessages((prev) => [
            ...prev,
            { id: botMsgId, role: "assistant", text: "", isStreaming: true },
        ]);

        // Build history for API (exclude system messages and error messages)
        const historyForApi = messages
            .filter((m) => m.role === "user" || m.role === "assistant")
            .filter((m) => !m.isStreaming)
            .slice(-10)
            .map((m) => ({
                role: m.role === "user" ? "user" : "model",
                text: m.text,
            }));

        try {
            abortRef.current = new AbortController();

            const response = await fetch("/api/chat/exercise", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    exerciseId,
                    message: trimmed,
                    history: historyForApi,
                    locale,
                }),
                signal: abortRef.current.signal,
            });

            // Handle non-streaming errors (auth, rate limit, etc.)
            if (!response.ok) {
                const data = await response.json().catch(() => ({ error: "chat.error" })) as { error?: string };
                const errorKey = data.error ?? "chat.error";
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === botMsgId
                            ? { ...m, role: "error", text: t(errorKey), errorKey, isStreaming: false }
                            : m
                    )
                );
                setIsLoading(false);
                return;
            }

            // Read the streaming response
            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response body");

            const decoder = new TextDecoder();
            let accumulated = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });

                // Check for error sentinel from server
                if (chunk.includes(ERROR_PREFIX)) {
                    const errorKey = chunk.split(ERROR_PREFIX)[1]?.trim() ?? "chat.error";
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === botMsgId
                                ? { ...m, role: "error", text: t(errorKey), errorKey, isStreaming: false }
                                : m
                        )
                    );
                    setIsLoading(false);
                    return;
                }

                accumulated += chunk;

                // Update the streaming bubble with accumulated text
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === botMsgId
                            ? { ...m, text: accumulated, isStreaming: true }
                            : m
                    )
                );
            }

            // Mark streaming as done
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === botMsgId ? { ...m, isStreaming: false } : m
                )
            );
        } catch (err) {
            if ((err as Error).name === "AbortError") {
                // User closed the sheet — silent cleanup
                setMessages((prev) => prev.filter((m) => m.id !== botMsgId));
                setIsLoading(false);
                return;
            }

            const isOffline = !navigator.onLine;
            const errorKey = isOffline ? "chat.offline" : "chat.error";

            setMessages((prev) =>
                prev.map((m) =>
                    m.id === botMsgId
                        ? { ...m, role: "error", text: t(errorKey), errorKey, isStreaming: false }
                        : m
                )
            );
        } finally {
            setIsLoading(false);
        }
    }, [inputValue, isLoading, messages, exerciseId, locale, t]);

    // ── Retry ────────────────────────────────────────────────────────────────
    const retryMessage = useCallback(
        (errorMsg: ChatMessage) => {
            // Find the user message just before the error bubble
            const idx = messages.findIndex((m) => m.id === errorMsg.id);
            const userMsg = messages[idx - 1];
            if (!userMsg || userMsg.role !== "user") return;

            // Remove the error bubble and re-set input to the user message
            setMessages((prev) => prev.filter((m) => m.id !== errorMsg.id));
            setInputValue(userMsg.text);
        },
        [messages]
    );

    // ── Key handler ──────────────────────────────────────────────────────────
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void sendMessage();
        }
    };

    // ── Auto-resize textarea ─────────────────────────────────────────────────
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    };

    return (
        <>
            {/* ── FAB ──────────────────────────────────────────────────────── */}
            {!isOpen && (
                <button
                    onClick={handleOpen}
                    aria-label={t("exercise.chat.fab")}
                    className="fixed z-40 flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-105"
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: "#39ff14",
                        bottom: "calc(80px + env(safe-area-inset-bottom))",
                        right: 16,
                        boxShadow:
                            "0 0 0 0 rgba(57,255,20,0.4), 0 0 16px rgba(57,255,20,0.5), 0 4px 24px rgba(0,0,0,0.5)",
                        animation: "fab-pulse 2.5s ease-in-out infinite",
                    }}
                >
                    <MessageCircle className="w-6 h-6" style={{ color: "#000" }} />
                </button>
            )}

            {/* ── Bottom Sheet ─────────────────────────────────────────────── */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
                        onClick={handleClose}
                    />

                    {/* Sheet panel */}
                    <div
                        className="fixed left-0 right-0 bottom-0 z-50 flex flex-col"
                        style={{
                            height: "70dvh",
                            maxWidth: "480px",
                            margin: "0 auto",
                            borderRadius: "20px 20px 0 0",
                            background: "#0a0a0a",
                            border: "1px solid rgba(57,255,20,0.15)",
                            borderBottom: "none",
                            boxShadow: "0 -4px 40px rgba(57,255,20,0.08), 0 -2px 0 rgba(57,255,20,0.2)",
                            animation: "sheet-slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
                        }}
                    >
                        {/* ── Sheet Header ─────────────────────────────────── */}
                        <div
                            className="flex items-center justify-between px-4 py-3 shrink-0"
                            style={{
                                borderBottom: "1px solid rgba(255,255,255,0.06)",
                            }}
                        >
                            {/* Drag handle */}
                            <div
                                className="absolute top-2.5 left-1/2 -translate-x-1/2 rounded-full"
                                style={{ width: 36, height: 4, background: "rgba(255,255,255,0.15)" }}
                            />

                            <div className="flex items-center gap-2.5 mt-1">
                                <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                                    style={{ background: "rgba(57,255,20,0.12)" }}
                                >
                                    <MessageCircle className="w-4 h-4" style={{ color: "#39ff14" }} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: "#f0f0f0" }}>
                                        {t("exercise.chat.title").replace("{exercise}", exerciseName)}
                                    </p>
                                    <p className="text-[10px]" style={{ color: "#39ff14" }}>
                                        GYM-AI · {locale === "es" ? "Asistente de entrenamiento" : "Training assistant"}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleClose}
                                className="flex items-center justify-center w-8 h-8 rounded-full transition-opacity hover:opacity-70 mt-1"
                                style={{ background: "rgba(255,255,255,0.06)" }}
                                aria-label="Close chat"
                            >
                                <X className="w-4 h-4" style={{ color: "#888" }} />
                            </button>
                        </div>

                        {/* ── Messages area ────────────────────────────────── */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
                            style={{ scrollBehavior: "smooth" }}
                        >
                            {messages.map((msg) => (
                                <MessageBubble
                                    key={msg.id}
                                    message={msg}
                                    onRetry={retryMessage}
                                    retryLabel={locale === "es" ? "Reintentar" : "Retry"}
                                />
                            ))}

                            {/* Typing indicator */}
                            {isLoading && messages[messages.length - 1]?.isStreaming === false && (
                                <TypingIndicator label={t("exercise.chat.typing")} />
                            )}
                        </div>

                        {/* ── Input area ───────────────────────────────────── */}
                        <div
                            className="px-3 pt-3 pb-3 shrink-0"
                            style={{
                                borderTop: "1px solid rgba(255,255,255,0.06)",
                                paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
                            }}
                        >
                            <div
                                className="flex items-end gap-2 rounded-2xl px-3 py-2"
                                style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                }}
                            >
                                <textarea
                                    ref={inputRef}
                                    value={inputValue}
                                    onChange={handleInput}
                                    onKeyDown={handleKeyDown}
                                    placeholder={t("exercise.chat.placeholder")}
                                    rows={1}
                                    disabled={isLoading}
                                    className="flex-1 bg-transparent resize-none text-sm outline-none disabled:opacity-50 py-1.5"
                                    style={{
                                        color: "#f0f0f0",
                                        lineHeight: "1.5",
                                        maxHeight: 120,
                                        minHeight: 36,
                                        fontFamily: "inherit",
                                    }}
                                />
                                <button
                                    onClick={() => void sendMessage()}
                                    disabled={!inputValue.trim() || isLoading}
                                    className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 transition-all disabled:opacity-30 active:scale-90"
                                    style={{
                                        background: inputValue.trim() && !isLoading ? "#39ff14" : "rgba(57,255,20,0.15)",
                                    }}
                                    aria-label="Send"
                                >
                                    <Send
                                        className="w-4 h-4"
                                        style={{ color: inputValue.trim() && !isLoading ? "#000" : "#39ff14" }}
                                    />
                                </button>
                            </div>
                            <p className="text-center text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                                {locale === "es" ? "La IA puede cometer errores. Verifica con un profesional." : "AI can make mistakes. Consult a professional."}
                            </p>
                        </div>
                    </div>
                </>
            )}

            {/* ── Keyframe animations (injected once) ──────────────────────── */}
            <style>{`
                @keyframes fab-pulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(57,255,20,0.4), 0 0 16px rgba(57,255,20,0.5), 0 4px 24px rgba(0,0,0,0.5); }
                    50%  { box-shadow: 0 0 0 8px rgba(57,255,20,0), 0 0 24px rgba(57,255,20,0.7), 0 4px 24px rgba(0,0,0,0.5); }
                }
                @keyframes sheet-slide-up {
                    from { transform: translateY(100%); }
                    to   { transform: translateY(0); }
                }
                @keyframes typing-dot {
                    0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
                    40%           { opacity: 1;   transform: scale(1); }
                }
                @keyframes cursor-blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                details > summary::-webkit-details-marker { display: none; }
            `}</style>
        </>
    );
}

// ── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({
    message,
    onRetry,
    retryLabel,
}: {
    message: ChatMessage;
    onRetry: (msg: ChatMessage) => void;
    retryLabel: string;
}) {
    if (message.role === "user") {
        return (
            <div className="flex justify-end">
                <div
                    className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed"
                    style={{ background: "rgba(57,255,20,0.15)", color: "#f0f0f0", border: "1px solid rgba(57,255,20,0.25)" }}
                >
                    {message.text}
                </div>
            </div>
        );
    }

    if (message.role === "error") {
        const isRateLimit = message.errorKey === "chat.rateLimit";
        const isOffline = message.errorKey === "chat.offline";

        return (
            <div className="flex justify-start">
                <div
                    className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-sm text-sm"
                    style={{
                        background: isRateLimit ? "rgba(251,191,36,0.08)" : "rgba(239,68,68,0.08)",
                        border: `1px solid ${isRateLimit ? "rgba(251,191,36,0.3)" : "rgba(239,68,68,0.3)"}`,
                        color: "#f0f0f0",
                    }}
                >
                    <div className="flex items-start gap-2 mb-2">
                        {isOffline ? (
                            <Wifi className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
                        ) : (
                            <AlertTriangle
                                className="w-4 h-4 shrink-0 mt-0.5"
                                style={{ color: isRateLimit ? "#f59e0b" : "#ef4444" }}
                            />
                        )}
                        <span className="leading-relaxed text-xs">{message.text}</span>
                    </div>
                    {!isRateLimit && (
                        <button
                            onClick={() => onRetry(message)}
                            className="flex items-center gap-1.5 text-xs font-medium mt-1 transition-opacity hover:opacity-70"
                            style={{ color: "#39ff14" }}
                        >
                            <RotateCcw className="w-3 h-3" />
                            {retryLabel}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // assistant message
    return (
        <div className="flex justify-start">
            <div className="flex items-start gap-2 max-w-[85%]">
                {/* Bot avatar */}
                <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "rgba(57,255,20,0.1)", border: "1px solid rgba(57,255,20,0.2)" }}
                >
                    <span className="text-[10px] font-bold" style={{ color: "#39ff14" }}>AI</span>
                </div>

                <div
                    className="px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed"
                    style={{
                        background: "#1a1a1a",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "#f0f0f0",
                        whiteSpace: "pre-wrap",
                    }}
                >
                    {message.text}
                    {message.isStreaming && (
                        <span
                            className="inline-block w-1.5 h-1.5 ml-1 mb-0.5 rounded-full"
                            style={{
                                background: "rgba(57,255,20,0.6)",
                                animation: "typing-dot 1s infinite alternate",
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// ── TypingIndicator ──────────────────────────────────────────────────────────

function TypingIndicator({ label }: { label: string }) {
    return (
        <div className="flex justify-start">
            <div className="flex items-start gap-2">
                <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "rgba(57,255,20,0.1)", border: "1px solid rgba(57,255,20,0.2)" }}
                >
                    <span className="text-[10px] font-bold" style={{ color: "#39ff14" }}>AI</span>
                </div>
                <div
                    className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm"
                    style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                                background: "#39ff14",
                                animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                            }}
                        />
                    ))}
                    <span className="text-xs ml-1" style={{ color: "#555" }}>{label}</span>
                </div>
            </div>
        </div>
    );
}

import type React from "react";
