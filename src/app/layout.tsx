import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { I18nProvider, type Locale } from "@/i18n";
import { cookies } from "next/headers";
import { PWAProvider } from "@/components/pwa/PWAProvider";
import { OfflineDetector } from "@/components/ui/OfflineDetector";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "GYM-AI — Entrenamiento Inteligente con IA",
    template: "%s | GYM-AI",
  },
  description: "Tu entrenador personal con inteligencia artificial. Rutinas personalizadas, tracking de progreso y gamificación.",
  metadataBase: new URL("https://gym-ai.vercel.app"),
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "GYM-AI",
  },
  appleWebApp: {
    capable: true,
    title: "Gym AI",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("gym-ai-locale")?.value ?? "es") as Locale;

  return (
    <html lang={locale} className="dark">
      <body className={`${spaceGrotesk.variable} antialiased`}>
        <I18nProvider initialLocale={locale}>
          <OfflineDetector />
          <PWAProvider />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
