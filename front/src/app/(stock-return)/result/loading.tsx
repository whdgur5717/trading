"use client"

import resultBones from "@/bones/stock-return-result.bones.json"
import { Skeleton } from "boneyard-js/react"

const fixture = (
  <section className="flex w-full max-w-form flex-col gap-6 rounded-2xl bg-surface-card p-xl shadow-surface inset-shadow-surface">
    <div className="flex flex-col items-center gap-2">
      <p className="text-center type-body text-muted">
        <span className="font-semibold text-ink">2020년 1월 2일</span> 종가에{" "}
        <span className="font-semibold text-primary">삼성전자</span>를 샀다면
      </p>
      <p className="flex min-h-15 flex-wrap items-center justify-center type-display text-gain tabular-nums">
        +1,234만원
      </p>
      <p className="type-title wrap-break-word text-gain">+123.45%</p>
    </div>

    <div className="h-40 w-full rounded-lg bg-surface-muted" />

    <div className="flex flex-col gap-2 rounded-xl bg-surface-muted p-lg type-label text-muted">
      <div className="flex items-center justify-between gap-3">
        <span>매수가</span>
        <span className="text-ink">50,000원</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span>수량</span>
        <span className="text-ink">100주</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span>매수 금액</span>
        <span className="text-ink">5,000,000원</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span>현재 평가액</span>
        <span className="text-right">
          <span className="block text-ink">12,345,600원</span>
          <span className="mt-1 block text-subtle">현재가 123,456원</span>
        </span>
      </div>
    </div>
  </section>
)

export default function Loading() {
  return (
    <Skeleton
      animate="solid"
      className="w-full max-w-form"
      color="var(--color-surface-muted)"
      fixture={fixture}
      initialBones={resultBones}
      loading
      name="stock-return-result"
    >
      {fixture}
    </Skeleton>
  )
}
