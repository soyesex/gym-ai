/**
 * @file app/page.tsx
 * Public Landing Page — Server Component.
 *
 * This is the public-facing homepage of GYM-AI.
 * It does NOT require authentication (excluded from PROTECTED_ROUTES in middleware).
 * The authenticated dashboard lives at /dashboard.
 */
import type { Metadata } from "next";
import LandingClient from "@/components/landing/LandingClient";

export const metadata: Metadata = {
  title: "GYM-AI — Tu Entrenador Personal con Inteligencia Artificial",
  description:
    "Rutinas personalizadas, planes según tu nivel, tracking de progreso y gamificación. Entrenamiento inteligente potenciado por IA. Empieza gratis.",
  keywords: [
    "gym", "fitness", "IA", "inteligencia artificial", "entrenamiento",
    "rutinas personalizadas", "workout tracker", "gamificación", "GYM-AI",
  ],
  openGraph: {
    title: "GYM-AI — Tu Entrenador Personal con Inteligencia Artificial",
    description:
      "Rutinas personalizadas con IA, planes según tu nivel, tracking de progreso y sistema de niveles. Empieza gratis.",
    type: "website",
    locale: "es_CO",
    siteName: "GYM-AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "GYM-AI — Tu Entrenador Personal con IA",
    description:
      "Entrenamiento inteligente potenciado por inteligencia artificial. Rutinas personalizadas, tracking y gamificación.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LandingPage() {
  return <LandingClient />;
}
