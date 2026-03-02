import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { I18nProvider, type Locale } from "@/i18n";
import { cookies } from "next/headers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "GYM-AI | Underground Tech Fitness",
  description: "AI-powered biometric training protocols for peak performance.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("gym-ai-locale")?.value ?? "en") as Locale;

  return (
    <html lang={locale} className="dark">
      <body className={`${spaceGrotesk.variable} antialiased`}>
        <I18nProvider initialLocale={locale}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
