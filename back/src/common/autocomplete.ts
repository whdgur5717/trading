import { canBeChoseong, getChoseong } from "es-hangul"

export type AutocompleteItem<TMetadata = Record<string, unknown>> = {
  id: string
  label: string
  value: string
  metadata?: TMetadata
}

export type AutocompleteResult<TMetadata = Record<string, unknown>> = {
  items: AutocompleteItem<TMetadata>[]
  hasMore: boolean
}

type IndexedItem<TMetadata> = AutocompleteItem<TMetadata> & {
  idKey: string
  labelKey: string
  labelChoseong: string
}

const MATCHERS = [
  <TMetadata>(item: IndexedItem<TMetadata>, input: string) =>
    item.idKey === input,
  (item, input) => item.idKey.startsWith(input),
  (item, input) => item.labelKey === input,
  (item, input) => item.labelKey.startsWith(input),
  (item, input) => isInputPrefixOfLabel(input, item.labelKey),
  (item, input) => item.labelKey.includes(input),
  (item, input) => item.labelChoseong.includes(input),
] satisfies Array<
  <TMetadata>(item: IndexedItem<TMetadata>, input: string) => boolean
>

export function createAutocomplete<TMetadata = Record<string, unknown>>(
  items: Array<AutocompleteItem<TMetadata>>
) {
  const indexedItems = items.map((item): IndexedItem<TMetadata> => {
    const labelKey = normalizeAutocompleteInput(item.label)

    return {
      ...item,
      idKey: normalizeAutocompleteInput(item.id),
      labelKey,
      labelChoseong: getChoseong(labelKey),
    }
  })

  return {
    suggest(input: string, limit: number): AutocompleteResult<TMetadata> {
      const query = normalizeAutocompleteInput(input)

      if (query.length === 0 || limit < 1) {
        return { items: [], hasMore: false }
      }

      const matches = indexedItems
        .flatMap((item) => {
          const priority = MATCHERS.findIndex((isMatch) => isMatch(item, query))

          return priority === -1 ? [] : [{ item, priority }]
        })
        .sort(
          (a, b) =>
            a.priority - b.priority ||
            a.item.label.localeCompare(b.item.label, "ko") ||
            a.item.id.localeCompare(b.item.id)
        )

      return {
        items: matches
          .slice(0, limit)
          .map(({ item }) => stripAutocompleteKeys(item)),
        hasMore: matches.length > limit,
      }
    },
  }
}

function normalizeAutocompleteInput(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "")
}

function isInputPrefixOfLabel(input: string, label: string): boolean {
  const inputLetters = [...input]
  const labelLetters = [...label]

  return (
    inputLetters.length <= labelLetters.length &&
    inputLetters.every((inputLetter, index) =>
      canBeChoseong(inputLetter)
        ? getChoseong(labelLetters[index]) === inputLetter
        : labelLetters[index] === inputLetter
    )
  )
}

function stripAutocompleteKeys<TMetadata>(
  item: IndexedItem<TMetadata>
): AutocompleteItem<TMetadata> {
  return {
    id: item.id,
    label: item.label,
    value: item.value,
    ...(item.metadata === undefined ? {} : { metadata: item.metadata }),
  }
}
