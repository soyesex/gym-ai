"use client";

import { useState, useEffect } from "react";
import Lottie from "lottie-react";
import { useTranslation, type Locale } from "@/i18n";
import animationData from "../../public/animations/gym-ai.json";

const LOADING_TEXTS: Record<Locale, string[]> = {
    es: [
        "Montando las pesas...",
        "Calentando motores...",
        "Cargando hierro...",
        "Preparando tu sesión...",
        "Activando el modo bestia...",
        "Ajustando la barra...",
    ],
    en: [
        "Racking the weights...",
        "Warming up...",
        "Loading iron...",
        "Prepping your session...",
        "Activating beast mode...",
        "Adjusting the bar...",
    ],
};

const TIPS: Record<Locale, string[]> = {
    es: [
        "La hidratación adecuada aumenta la fuerza hasta un 15%. ¡Toma agua, guerrero!",
        "Dormir 7-9 horas aumenta tu recuperación muscular en un 60%.",
        "Calentar 10 minutos reduce el riesgo de lesiones un 50%.",
        "La proteína post-entreno se absorbe mejor en los 30 minutos siguientes.",
    ],
    en: [
        "Proper hydration increases strength by up to 15%. Drink up, warrior!",
        "Sleeping 7-9 hours boosts muscle recovery by 60%.",
        "A 10-minute warm-up reduces injury risk by 50%.",
        "Post-workout protein absorbs best within 30 minutes.",
    ],
};

export default function Loading() {
    const { locale } = useTranslation();

    const [msgIndex, setMsgIndex] = useState(0);
    const [tipIndex, setTipIndex] = useState(0);
    const [visible, setVisible] = useState(true);

    const texts = LOADING_TEXTS[locale] || LOADING_TEXTS.en;
    const tips = TIPS[locale] || TIPS.en;

    // Initialize random tip and text on mount
    useEffect(() => {
        setMsgIndex(Math.floor(Math.random() * texts.length));
        setTipIndex(Math.floor(Math.random() * tips.length));
    }, [texts.length, tips.length]);

    // Rotate messages every 3 seconds with fade
    useEffect(() => {
        const interval = setInterval(() => {
            setVisible(false);
            setTimeout(() => {
                setMsgIndex((prev) => (prev + 1) % texts.length);
                setVisible(true);
            }, 300);
        }, 3000);

        return () => clearInterval(interval);
    }, [texts.length]);

    return (
        <main className="min-h-screen relative flex items-center justify-center overflow-hidden bg-black text-white">
            <style>{`
                @keyframes flicker {
                    0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }
                    20%, 22%, 24%, 55% { opacity: 0.4; }
                }
                .animate-flicker {
                    animation: flicker 4s infinite;
                }
                .glow-pulse {
                    filter: drop-shadow(0 0 10px rgba(57, 255, 20, 0.8));
                }
                .neon-text-glow {
                    text-shadow: 0 0 8px #39ff14, 0 0 20px #39ff14;
                }
                @keyframes spin-slow {
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 3s linear infinite;
                }
                @keyframes spin-fast {
                    to { transform: rotate(360deg); }
                }
                .animate-spin-fast {
                    animation: spin-fast 1s linear infinite;
                }
                .glass-card {
                    background: rgba(10, 10, 10, 0.7);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(57, 255, 20, 0.15);
                }
            `}</style>

            {/* Background: high quality gym overlay or radial gradient */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Fallback to radial neon gradient if no image */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(57,255,20,0.05)_0%,transparent_50%)]"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-lg px-4 gap-12">
                {/* Center Animation and Rings */}
                <div className="relative flex items-center justify-center">
                    {/* Outer Ring */}
                    <div className="absolute w-48 h-48 border border-[#39ff14] rounded-full opacity-20 border-dashed animate-spin-slow"></div>
                    {/* Inner Ring */}
                    <div className="absolute w-40 h-40 border-2 border-t-[#39ff14] border-r-transparent border-b-transparent border-l-transparent rounded-full opacity-50 animate-spin-fast"></div>
                    
                    {/* Lottie Animation at the exact center */}
                    <div className="relative w-[120px] h-[120px] flex items-center justify-center z-20 glow-pulse">
                        <Lottie
                            animationData={animationData}
                            loop={true}
                            autoplay={true}
                            style={{ width: "100%", height: "100%" }}
                        />
                    </div>
                </div>

                {/* Rotating Loading Text */}
                <div 
                    className="h-8 flex items-center justify-center transition-opacity duration-300" 
                    style={{ opacity: visible ? 1 : 0 }}
                >
                    <p className="text-lg font-display tracking-widest uppercase text-[#39ff14] animate-flicker neon-text-glow text-center">
                        {texts[msgIndex]}
                    </p>
                </div>

                {/* Random Gym Tip Card */}
                <div className="w-full mt-4 p-5 rounded-2xl glass-card text-center flex flex-col items-center gap-3">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#39ff14]/10 text-[#39ff14] border border-[#39ff14]/30">
                        Gym-AI Insight
                    </span>
                    <p className="text-sm md:text-base text-gray-300 font-sans max-w-[280px]">
                        {tips[tipIndex]}
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-8 left-0 w-full text-center pointer-events-none">
                <p className="font-mono text-zinc-600 tracking-widest text-[10px] uppercase">
                    Systems active // Connection: Secure
                </p>
            </div>
        </main>
    );
}
