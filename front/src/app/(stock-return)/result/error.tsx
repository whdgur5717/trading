"use client"

import { Button } from "@/components/button"
import Link from "next/link"

export default function ResultError({ reset }: { reset: () => void }) {
  return (
    <div className="grid w-full max-w-form gap-6">
      <section
        className="grid gap-6 rounded-2xl bg-surface-raised p-xl"
        aria-label="오류"
      >
        <h1 className="type-title text-ink">일시적인 오류가 발생했어요</h1>

        <div className="grid gap-3">
          <Button size="lg" onClick={reset}>
            다시 시도하기
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/">처음으로 돌아가기</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
