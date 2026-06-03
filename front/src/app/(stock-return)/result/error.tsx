"use client"

import { Button } from "@/components/button"
import Link from "next/link"

export default function ResultError() {
  return (
    <div className="grid w-full max-w-form gap-6">
      <section
        className="grid gap-6 rounded-2xl bg-surface-raised p-xl"
        aria-label="계산 실패"
      >
        <h1 className="type-title text-ink">
          해당 날짜의 기준가를 찾지 못했어요
        </h1>

        <Button asChild size="lg">
          <Link href="/">다시 입력하기</Link>
        </Button>
      </section>
    </div>
  )
}
