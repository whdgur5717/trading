import "./globals.css"
import { DevelopmentTools } from "./development-tools"
import { Providers } from "./providers"
import localFont from "next/font/local"
import { NuqsAdapter } from "nuqs/adapters/next/app"

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
