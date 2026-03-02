"use client";

/**
 * @file components/home/BottomNav.tsx
 * Bottom navigation bar with a central FAB "+" button.
 *
 * Layout: Home | Library | [+ FAB] | Stats | Profile
 *
 * The FAB "+" routes to `/log` (Training Log) — the primary action
 * for starting or reviewing workout sessions.
 *
 * "Library" points to `/workouts` (Exercise Library).
 *
 * All labels are translated via the i18n context.
 */

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Dumbbell, BarChart2, User, Plus } from "lucide-react";
import { useTranslation } from "@/i18n";

/** Standard nav items (displayed around the FAB) */
const leftItems = [
    { href: "/", labelKey: "nav.home", icon: Home },
    { href: "/workouts", labelKey: "nav.library", icon: Dumbbell },
];

const rightItems = [
    { href: "/stats", labelKey: "nav.stats", icon: BarChart2 },
    { href: "/profile", labelKey: "nav.profile", icon: User },
];

export default function BottomNav() {
    const pathname = usePathname();
    const { t } = useTranslation();

    /**
     * Determines whether a nav item is active.
     * "/" needs exact match; other routes use prefix matching.
     */
    const isActive = (href: string) =>
        href === "/" ? pathname === "/" : pathname.startsWith(href);

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-20 flex justify-around items-center px-4 py-3"
            style={{
                background: "rgba(0,0,0,0.85)",
                backdropFilter: "blur(20px)",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                maxWidth: "480px",
                margin: "0 auto",
            }}
        >
            {/* Left items */}
            {leftItems.map(({ href, labelKey, icon: Icon }) => (
                <NavItem
                    key={href}
                    href={href}
                    label={t(labelKey)}
                    icon={Icon}
                    active={isActive(href)}
                />
            ))}

            {/* Central FAB "+" button → routes to Training Log */}
            <Link
                href="/log"
                className="relative -mt-8 flex items-center justify-center"
            >
                <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{
                        background: "#39ff14",
                        boxShadow: "0 0 24px rgba(57,255,20,0.4)",
                        border: "3px solid #000",
                    }}
                >
                    <Plus className="w-7 h-7" style={{ color: "#000" }} />
                </motion.div>
            </Link>

            {/* Right items */}
            {rightItems.map(({ href, labelKey, icon: Icon }) => (
                <NavItem
                    key={href}
                    href={href}
                    label={t(labelKey)}
                    icon={Icon}
                    active={isActive(href)}
                />
            ))}
        </nav>
    );
}

// ── Nav Item ───────────────────────────────────────────────────────────────────

interface NavItemProps {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    active: boolean;
}

/**
 * Individual navigation item with animated indicator bar and neon glow effect.
 */
function NavItem({ href, label, icon: Icon, active }: NavItemProps) {
    return (
        <Link
            href={href}
            className="flex flex-col items-center gap-1 relative"
        >
            {active && (
                <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-3 w-8 h-0.5 rounded-full"
                    style={{ backgroundColor: "#39ff14" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
            )}
            <motion.div
                whileTap={{ scale: 0.85 }}
                className="p-1"
                style={{ color: active ? "#39ff14" : "rgba(255,255,255,0.4)" }}
            >
                <Icon
                    className="w-5 h-5"
                    style={{
                        filter: active
                            ? "drop-shadow(0 0 6px rgba(57,255,20,0.7))"
                            : "none",
                    }}
                />
            </motion.div>
            <span
                className="text-[10px] font-medium tracking-wider"
                style={{ color: active ? "#39ff14" : "rgba(255,255,255,0.35)" }}
            >
                {label.toUpperCase()}
            </span>
        </Link>
    );
}
