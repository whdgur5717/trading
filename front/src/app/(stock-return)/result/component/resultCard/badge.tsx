"use client"

import type { ReactNode } from "react"

import { useResultCardContext } from "./context"
import { resultCard } from "./style"

type ResultCardBadgeProps = {
  children: ReactNode
}

export function ResultCardBadge({ children }: ResultCardBadgeProps) {
  const { status } = useResultCardContext("ResultCard.Badge")
  const styles = resultCard({ status })

  return (
    <span className={styles.badge()}>
      <span className="break-keep">{children}</span>
    </span>
  )
}
