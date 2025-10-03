import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Nakidka Core",
  description: "Management forms and metadata for 1C:Enterprise-like systems",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
