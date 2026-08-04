"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"
import { ThemeProvider } from "@/contexts/theme"
import { FontSizeProvider } from "@/contexts/font-size"

export function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <FontSizeProvider>
          {children}
        </FontSizeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
