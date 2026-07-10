import { converter, parse } from "culori"

const toRgb = converter("rgb")
const varPattern = /var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g
const cssColorPattern = /^(?:var\(|oklch\(|oklab\(|lch\(|lab\(|color\()/i

export function resolveCssColors<T>(root: HTMLElement, value: T): T {
  const rootStyle = getComputedStyle(root)

  return resolveValue(value, rootStyle) as T
}

function resolveValue(value: unknown, rootStyle: CSSStyleDeclaration): unknown {
  if (typeof value === "string") {
    return resolveColor(value, rootStyle)
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveValue(item, rootStyle))
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        resolveValue(item, rootStyle),
      ])
    )
  }

  return value
}

function resolveColor(color: string, rootStyle: CSSStyleDeclaration) {
  if (!cssColorPattern.test(color)) {
    return color
  }

  const resolved = color.replace(
    varPattern,
    (_, name: string, fallback?: string) =>
      rootStyle.getPropertyValue(name).trim() || fallback?.trim() || ""
  )
  const rgb = toRgb(parse(resolved))

  if (!rgb) {
    return color
  }

  return `rgba(${toChannel(rgb.r)}, ${toChannel(rgb.g)}, ${toChannel(
    rgb.b
  )}, ${rgb.alpha ?? 1})`
}

function toChannel(value: number) {
  return Math.round(Math.min(1, Math.max(0, value)) * 255)
}
