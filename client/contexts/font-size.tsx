"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type FontSize = "normal" | "large" | "xlarge"

const SCALE_MAP: Record<FontSize, number> = { normal: 1, large: 1.2, xlarge: 1.45 }

type FontSizeContextValue = {
  fontSize: FontSize
  scale: number
  setFontSize: (s: FontSize) => void
  increase: () => void
  decrease: () => void
}

const FontSizeContext = createContext<FontSizeContextValue>({
  fontSize: "normal",
  scale: 1,
  setFontSize: () => {},
  increase: () => {},
  decrease: () => {},
})

const ORDER: FontSize[] = ["normal", "large", "xlarge"]

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>("normal")

  useEffect(() => {
    const stored = localStorage.getItem("geopic-fontsize") as FontSize | null
    if (stored && ORDER.includes(stored)) setFontSizeState(stored)
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty("--font-scale", String(SCALE_MAP[fontSize]))
    localStorage.setItem("geopic-fontsize", fontSize)
  }, [fontSize])

  const scale = SCALE_MAP[fontSize]

  function setFontSize(s: FontSize) { setFontSizeState(s) }
  function increase() {
    const idx = ORDER.indexOf(fontSize)
    if (idx < ORDER.length - 1) setFontSizeState(ORDER[idx + 1])
  }
  function decrease() {
    const idx = ORDER.indexOf(fontSize)
    if (idx > 0) setFontSizeState(ORDER[idx - 1])
  }

  return (
    <FontSizeContext.Provider value={{ fontSize, scale, setFontSize, increase, decrease }}>
      {children}
    </FontSizeContext.Provider>
  )
}

export function useFontSize() {
  return useContext(FontSizeContext)
}
