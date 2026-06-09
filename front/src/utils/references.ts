import type { Direction, Reference } from "./policy"
import { ReferencesSchema } from "./policy"
import data from "./references.json"

const references = ReferencesSchema.parse(data)

const numberFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 2,
})

const rounding = {
  ceil: Math.ceil,
  floor: Math.floor,
  round: Math.round,
}

function formatNumber(value: number, precision: number) {
  return numberFormatter.format(Number(value.toFixed(precision)))
}

function isInRange(amount: number, reference: Reference) {
  return (
    amount >= reference.range.min &&
    (reference.range.max === undefined || amount <= reference.range.max)
  )
}

function formatReference(reference: Reference, amount: number) {
  switch (reference.kind) {
    case "count": {
      const count = rounding[reference.rounding](amount / reference.amount)

      return `${reference.name} ${formatNumber(count, reference.precision)}${reference.countUnit}`
    }
    case "rate": {
      const quantity = rounding[reference.rounding](amount / reference.amount)

      return `${reference.name} ${formatNumber(quantity, reference.precision)}${reference.quantityUnit}`
    }
    case "goal": {
      const percent = (amount / reference.amount) * 100

      return `${reference.name} ${formatNumber(percent, reference.precision)}%`
    }
    case "level": {
      const level = reference.levels.filter(({ min }) => amount >= min).at(-1)

      return level?.name ?? reference.levels[0].name
    }
  }
}

function isDisplayableReference(reference: Reference, amount: number) {
  switch (reference.kind) {
    case "count":
    case "rate": {
      const value = rounding[reference.rounding](amount / reference.amount)

      return Number(value.toFixed(reference.precision)) > 0
    }
    case "goal": {
      const percent = (amount / reference.amount) * 100

      return Number(percent.toFixed(reference.precision)) > 0
    }
    case "level":
      return true
  }
}

export function getReferenceTexts(amount: number, direction: Direction) {
  const selectedKinds = new Set<string>()

  return references.references
    .filter(
      (reference) =>
        reference.enabled &&
        reference.directions.includes(direction) &&
        isInRange(amount, reference) &&
        isDisplayableReference(reference, amount)
    )
    .sort((a, b) => b.rank - a.rank)
    .filter((reference) => {
      const isDuplicate =
        references.selection.distinctKinds && selectedKinds.has(reference.kind)

      selectedKinds.add(reference.kind)

      return !isDuplicate
    })
    .slice(0, references.selection.maxItems)
    .map((reference) => formatReference(reference, amount))
}
