"use client";

import { useEffect } from "react";

export default function ScrollToTop() {
    useEffect(() => {
        // Enforce scroll to top on mount.
        // Useful for Next.js pages where scroll restoration behaves unexpectedly.
        window.scrollTo(0, 0);
    }, []);

    return null;
}
