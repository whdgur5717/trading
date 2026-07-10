import "./globals.css"
import { DevelopmentTools } from "./development-tools"
import { Providers } from "./providers"
import localFont from "next/font/local"
import type { Metadata } from "next"
import { NuqsAdapter } from "nuqs/adapters/next/app"

const pretendard = localFont({
  src: "../../public/fonts/pretendard/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_ORIGIN!),
  title: "이때 살걸",
  description: "이때 그 종목을 샀다면 지금 얼마였을지 계산해보세요.",
  openGraph: {
    title: "이때 살걸",
    description: "이때 이 종목을 샀다면 지금 얼마였을지 계산해보세요.",
    siteName: "이때 살걸",
    locale: "ko_KR",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html className={pretendard.variable} lang="ko">
      <body>
        <NuqsAdapter>
          <Providers>
            {children}
            <DevelopmentTools />
          </Providers>
        </NuqsAdapter>
      </body>
    </html>
  )
}
