import type { Metadata } from "next"
import "@ant-design/v5-patch-for-react-19"

export const metadata: Metadata = {
  title: "Nakidka Core",
  description: "Management forms and metadata for 1C:Enterprise-like systems",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
