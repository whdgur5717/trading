const WORD_PATTERN =
  /\p{Lu}?\p{Ll}+|[0-9]+|\p{Lu}+(?!\p{Ll})|\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{L}+/gu

function words(value) {
  return Array.from(String(value).match(WORD_PATTERN) ?? [])
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

export function constantCase(value) {
  return words(value)
    .map((word) => word.toUpperCase())
    .join("_")
}

export function pascalCase(value) {
  return words(value).map(capitalize).join("")
}
