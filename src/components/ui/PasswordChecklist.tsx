"use client";

/**
 * @file components/ui/PasswordChecklist.tsx
 * Real-time visual password strength checklist.
 *
 * Shows a mini checklist below the password field that updates
 * as the user types. Each rule starts gray and turns green when met.
 * This is purely client-side UX — real validation is server-side.
 */
import { useTranslation } from "@/i18n";

interface PasswordChecklistProps {
    password: string;
}

interface Rule {
    key: string;
    test: (pw: string) => boolean;
}

const RULES: Rule[] = [
    { key: "auth.rule8Chars", test: (pw) => pw.length >= 8 },
    { key: "auth.ruleUppercase", test: (pw) => /[A-Z]/.test(pw) },
    { key: "auth.ruleLowercase", test: (pw) => /[a-z]/.test(pw) },
    { key: "auth.ruleNumber", test: (pw) => /\d/.test(pw) },
    { key: "auth.ruleSymbol", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export default function PasswordChecklist({ password }: PasswordChecklistProps) {
    const { t } = useTranslation();

    if (!password) return null;

    return (
        <div className="grid grid-cols-1 gap-1 pt-1.5 pb-1">
            {RULES.map((rule) => {
                const passed = rule.test(password);
                return (
                    <div
                        key={rule.key}
                        className="flex items-center gap-2 text-xs transition-colors duration-200"
                        style={{ color: passed ? "#39ff14" : "rgba(255,255,255,0.25)" }}
                    >
                        <span className="w-3.5 text-center flex-shrink-0">
                            {passed ? "✓" : "✗"}
                        </span>
                        <span>{t(rule.key)}</span>
                    </div>
                );
            })}
        </div>
    );
}
