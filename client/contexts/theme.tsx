"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type ThemeId = "graphite" | "midnight" | "slate" | "paper" | "ivory" | "classic"

type ThemeContextValue = {
  theme: ThemeId
  setTheme: (t: ThemeId) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "graphite",
  setTheme: () => {},
  isDark: true,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("graphite")

  useEffect(() => {
    const stored = localStorage.getItem("geopic-theme") as ThemeId | null
    if (stored) setThemeState(stored)
  }, [])

  function setTheme(t: ThemeId) {
    setThemeState(t)
    localStorage.setItem("geopic-theme", t)
  }

  useEffect(() => {
    document.documentElement.className = `theme-${theme}`
  }, [theme])

  const isDark = ["graphite", "midnight", "slate"].includes(theme)

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
