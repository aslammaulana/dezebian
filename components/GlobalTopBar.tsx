"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export function GlobalTopBar() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Avoid hydration mismatch
    useEffect(() => { setMounted(true) }, [])

    const isDark = theme === "dark"

    return (
        <div className="global-top-bar fixed top-0 left-0 right-0 z-9999 flex items-center justify-between px-5 h-9 border-b">
            {/* Brand */}
            <span className="text-xs font-semibold tracking-widest uppercase opacity-60 select-none">
                Dezebian
            </span>

            {/* Right side */}
            <div className="flex items-center gap-3">
                <span className="text-[11px] opacity-50 select-none hidden sm:inline">
                    {mounted ? (isDark ? "Dark Mode" : "Light Mode") : ""}
                </span>

                {/* Toggle */}
                <button
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    aria-label="Toggle theme"
                    className="theme-toggle-btn relative flex items-center w-[44px] h-[22px] rounded-full transition-all duration-300 cursor-pointer"
                >
                    {/* Track */}
                    <span className="absolute inset-0 rounded-full transition-all duration-300 theme-toggle-track" />
                    {/* Thumb */}
                    <span
                        className={`relative z-10 flex items-center justify-center w-[18px] h-[18px] rounded-full shadow-md transition-all duration-300 theme-toggle-thumb ${mounted && isDark ? "translate-x-[24px]" : "translate-x-[2px]"}`}
                    >
                        {mounted && (
                            isDark
                                ? <Moon size={10} className="text-white" />
                                : <Sun size={10} className="text-yellow-600" />
                        )}
                    </span>
                </button>
            </div>
        </div>
    )
}
