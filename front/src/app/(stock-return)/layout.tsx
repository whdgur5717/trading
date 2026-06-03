import type { ReactNode } from "react"

export default function StockReturnLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <main className="min-h-dvh bg-bg font-sans text-ink">
      <section className="mx-auto grid min-h-dvh w-full max-w-page content-start justify-items-center px-page-x py-page-y">
        {children}
      </section>
    </main>
  )
}
