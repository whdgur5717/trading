import "./globals.css"
import { Providers } from "./providers"
import localFont from "next/font/local"

const pretendard = localFont({
  src: "../../public/fonts/pretendard/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html className={pretendard.variable} lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
