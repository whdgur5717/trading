import { isArrayBuffer, isString } from "es-toolkit"
import type WebSocket from "ws"

export function webSocketDataAsText(data: WebSocket.RawData): string {
  if (isString(data)) {
    return data
  }

  if (Buffer.isBuffer(data)) {
    return data.toString("utf8")
  }

  if (isArrayBuffer(data)) {
    return Buffer.from(data).toString("utf8")
  }

  return Buffer.concat(data).toString("utf8")
}
