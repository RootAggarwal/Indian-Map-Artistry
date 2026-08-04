import type { ReactNode } from "react"
import "./globals.css"
import { Providers } from "./providers"

export const metadata = {
  title: "GEOPIC — Seismic Data Processing Atlas",
  description: "Basin-wise seismic processing intelligence mapped across the Indian extent.",
  icons: { icon: "/favicon.ico" },
  other: {
    "og:title": "GEOPIC — Seismic Data Processing Atlas",
    "og:description": "Basin-wise seismic processing intelligence mapped across the Indian extent.",
    "og:type": "website",
    "twitter:card": "summary_large_image",
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700;12..96,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body suppressHydrationWarning><Providers>{children}</Providers></body>
    </html>
  )
}
