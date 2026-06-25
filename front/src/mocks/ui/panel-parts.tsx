import { Check, PanelRightClose, RefreshCw } from "lucide-react"
import { Popover } from "radix-ui"

import type {
  MockOperationState,
  MockResponseTemplate,
} from "@/mocks/runtime/types"
import { cn } from "@/utils/cn"

type PanelFrameProps = {
  children: React.ReactNode
}

type OperationListProps = {
  operations: readonly MockOperationState[]
  selectedOperationId: string | undefined
  refresh: () => void
  select: (operation: MockOperationState) => void
  disabled: boolean
}

type StatusListProps = {
  responses: readonly MockResponseTemplate[]
  selectedResponseId: string
  activeResponseId: string | undefined
  select: (responseId: string) => void
  disabled: boolean
}

export function PanelFrame({ children }: PanelFrameProps) {
  return (
    <section className="flex max-h-[min(44rem,calc(100dvh-2rem))] w-[min(52rem,calc(100dvw-2rem))] flex-col overflow-hidden rounded-lg bg-surface shadow-2xl">
      <header className="flex items-center justify-between gap-md border-b border-surface-raised p-md">
        <div className="flex flex-col gap-xs">
          <p className="type-label text-primary">Mock backend</p>
          <h2 className="type-title">API Mock Control</h2>
        </div>
        <Popover.Close asChild>
          <button
            aria-label="닫기"
            className="inline-flex size-touch items-center justify-center rounded-sm bg-surface-raised text-muted"
            title="닫기"
            type="button"
          >
            <PanelRightClose size={18} />
          </button>
        </Popover.Close>
      </header>
      <div className="grid min-h-0 grid-cols-1 gap-md overflow-auto p-md lg:grid-cols-[16rem_1fr]">
        {children}
      </div>
    </section>
  )
}

export function OperationList({
  operations,
  selectedOperationId,
  refresh,
  select,
  disabled,
}: OperationListProps) {
  return (
    <section className="flex min-h-0 flex-col gap-sm">
      <div className="flex items-center justify-between gap-md">
        <h3 className="type-title">Operations</h3>
        <button
          className="inline-flex h-touch items-center gap-sm rounded-sm bg-surface-raised px-md type-label text-muted"
          disabled={disabled}
          onClick={refresh}
          type="button"
        >
          <RefreshCw size={16} />
          새로고침
        </button>
      </div>

      <div className="flex max-h-96 flex-col gap-xs overflow-auto">
        {operations.map((operation) => (
          <button
            className={cn(
              "flex min-h-touch flex-col items-start gap-xs rounded-sm px-md py-sm text-left type-label",
              operation.operationId === selectedOperationId
                ? "bg-primary text-primary-foreground"
                : "bg-surface-muted text-muted"
            )}
            disabled={disabled}
            key={operation.operationId}
            onClick={() => select(operation)}
            type="button"
          >
            <span>
              {operation.method} {operation.path}
            </span>
            <span className="text-subtle">{operation.operationId}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

export function StatusList({
  responses,
  selectedResponseId,
  activeResponseId,
  select,
  disabled,
}: StatusListProps) {
  return (
    <div className="flex flex-wrap items-center gap-sm">
      {responses.map((response) => (
        <button
          className={cn(
            "inline-flex h-touch items-center gap-sm rounded-sm px-md type-label",
            response.responseId === selectedResponseId
              ? "bg-accent text-accent-foreground"
              : "bg-surface-muted text-muted"
          )}
          disabled={disabled}
          key={response.responseId}
          onClick={() => select(response.responseId)}
          type="button"
        >
          {activeResponseId === response.responseId && <Check size={16} />}
          {response.label}
        </button>
      ))}
    </div>
  )
}
