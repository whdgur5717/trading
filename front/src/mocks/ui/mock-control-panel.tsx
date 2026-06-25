"use client"

import { Play, Power, Save, ServerOff } from "lucide-react"
import { Popover } from "radix-ui"
import { useMemo, useState } from "react"

import type { MockOperationState } from "@/mocks/runtime/types"

import {
  clearMockOperation,
  readMockOperations,
  requestPreview,
  saveMockOverride,
  type MockTestResult,
} from "./client"
import {
  editableResponseBody,
  preferredOperation,
  responseBodyText,
  selectionForOperation,
} from "./model"
import { OperationList, PanelFrame, StatusList } from "./panel-parts"

type Notice = {
  text: string
  tone: "normal" | "error"
}

export function MockControlPanel() {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [operations, setOperations] = useState<MockOperationState[]>([])
  const [operationId, setOperationId] = useState("")
  const [responseId, setResponseId] = useState("")
  const [bodyText, setBodyText] = useState("")
  const [requestUrl, setRequestUrl] = useState("")
  const [notice, setNotice] = useState<Notice | null>(null)
  const [result, setResult] = useState<MockTestResult | null>(null)

  const operation = useMemo(
    () => preferredOperation(operations, operationId),
    [operations, operationId]
  )

  function selectOperation(nextOperation: MockOperationState | undefined) {
    const selection = selectionForOperation(nextOperation)

    setNotice(null)
    setResult(null)
    setOperationId(selection.operationId)
    setResponseId(selection.responseId)
    setBodyText(selection.bodyText)
    setRequestUrl(selection.requestUrl)
  }

  async function refreshOperations(targetOperationId = operationId) {
    const nextOperations = await readMockOperations()

    setOperations(nextOperations)
    selectOperation(preferredOperation(nextOperations, targetOperationId))
  }

  function runMockAction(task: () => Promise<void>) {
    if (busy) {
      return
    }

    setBusy(true)
    setNotice(null)
    task()
      .catch((error: Error) => {
        setNotice({ text: error.message, tone: "error" })
      })
      .finally(() => {
        setBusy(false)
      })
  }

  async function enableResponse(nextResponseId: string) {
    const response = operation?.responses.find(
      (item) => item.responseId === nextResponseId
    )

    if (!operation || !response) {
      return
    }

    const nextBodyText = responseBodyText(response.body)

    setResult(null)
    setResponseId(nextResponseId)
    setBodyText(nextBodyText)

    await saveMockOverride({
      operationId: operation.operationId,
      responseId: nextResponseId,
      body: editableResponseBody(nextBodyText, response.contentType),
    })
    await refreshOperations(operation.operationId)
    setNotice({ text: "mock enabled", tone: "normal" })
  }

  async function save() {
    const response = operation?.responses.find(
      (item) => item.responseId === responseId
    )

    if (!operation || !response) {
      return
    }

    await saveMockOverride({
      operationId: operation.operationId,
      responseId,
      body: editableResponseBody(bodyText, response.contentType),
    })
    await refreshOperations(operation.operationId)
    setNotice({ text: "mock saved", tone: "normal" })
  }

  async function passthrough() {
    if (!operation) {
      return
    }

    await clearMockOperation(operation.operationId)
    await refreshOperations(operation.operationId)
    setNotice({ text: "passthrough enabled", tone: "normal" })
  }

  async function preview() {
    if (!requestUrl) {
      return
    }

    setResult(await requestPreview(requestUrl))
  }

  return (
    <Popover.Root
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)

        if (nextOpen && operations.length === 0) {
          runMockAction(() => refreshOperations())
        }
      }}
      open={open}
    >
      <Popover.Trigger asChild>
        <button
          aria-label="API mock control"
          className="fixed right-lg bottom-lg z-50 inline-flex size-touch items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl"
          title="API mock control"
          type="button"
        >
          <Power size={20} />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          className="z-50 text-ink"
          collisionPadding={16}
          side="top"
          sideOffset={12}
        >
          <PanelFrame>
            <OperationList
              operations={operations}
              disabled={busy}
              refresh={() => runMockAction(() => refreshOperations())}
              select={selectOperation}
              selectedOperationId={operation?.operationId}
            />

            <section className="flex min-w-0 flex-col gap-md">
              {operation ? (
                <>
                  <StatusList
                    activeResponseId={operation.override?.responseId}
                    disabled={busy}
                    responses={operation.responses}
                    select={(nextResponseId) =>
                      runMockAction(() => enableResponse(nextResponseId))
                    }
                    selectedResponseId={responseId}
                  />

                  <label className="flex flex-col gap-sm type-label text-muted">
                    Request URL
                    <input
                      className="h-touch rounded-sm bg-surface-muted px-md text-ink outline-none"
                      onChange={(event) => setRequestUrl(event.target.value)}
                      value={requestUrl}
                    />
                  </label>

                  <label className="flex flex-col gap-sm type-label text-muted">
                    Response Body
                    <textarea
                      className="min-h-80 resize-y rounded-sm bg-surface-muted p-md font-mono text-label/relaxed font-normal text-ink outline-none"
                      onChange={(event) => setBodyText(event.target.value)}
                      spellCheck={false}
                      value={bodyText}
                    />
                  </label>

                  <div className="flex flex-wrap gap-sm">
                    <button
                      className="inline-flex h-touch items-center gap-sm rounded-sm bg-primary px-lg type-label text-primary-foreground"
                      disabled={busy}
                      onClick={() => runMockAction(save)}
                      type="button"
                    >
                      <Save size={16} />
                      저장
                    </button>
                    <button
                      className="inline-flex h-touch items-center gap-sm rounded-sm bg-surface-raised px-lg type-label text-muted"
                      disabled={busy}
                      onClick={() => runMockAction(passthrough)}
                      type="button"
                    >
                      <ServerOff size={16} />
                      Passthrough
                    </button>
                    <button
                      className="inline-flex h-touch items-center gap-sm rounded-sm bg-tease px-lg type-label text-tease-foreground"
                      disabled={busy}
                      onClick={() => runMockAction(preview)}
                      type="button"
                    >
                      <Play size={16} />
                      요청 테스트
                    </button>
                  </div>

                  {notice && (
                    <p
                      className={
                        notice.tone === "error"
                          ? "type-label text-loss"
                          : "type-label text-muted"
                      }
                    >
                      {notice.text}
                    </p>
                  )}

                  {result && (
                    <section className="flex flex-col gap-sm rounded-md bg-surface-muted p-md">
                      <h3 className="type-title">Result {result.status}</h3>
                      <pre className="overflow-auto rounded-sm bg-bg p-md font-mono text-label/relaxed whitespace-pre-wrap text-ink">
                        {result.body}
                      </pre>
                    </section>
                  )}
                </>
              ) : (
                <p className="type-body text-muted">
                  mock operation이 없습니다.
                </p>
              )}
            </section>
          </PanelFrame>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
