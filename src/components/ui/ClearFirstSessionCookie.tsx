"use client";

import { useEffect } from "react";

export default function ClearFirstSessionCookie() {
    useEffect(() => {
        // Sets the cookie to 0 so future navigations use Skeletons instead of the heavy Lottie
        document.cookie = "gym_ai_first_session=0; path=/";
    }, []);

    return null;
}
