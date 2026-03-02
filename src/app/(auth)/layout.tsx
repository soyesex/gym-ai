/**
 * @file app/(auth)/layout.tsx
 * Layout for auth screens (/login, /signup in the future).
 * Full-screen centered layout with the app's dark neon aesthetic.
 * The `(auth)` folder group does NOT add a URL segment.
 */
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div
            className="min-h-screen flex items-center justify-center px-5"
            style={{ background: "#000" }}
        >
            {children}
        </div>
    );
}
