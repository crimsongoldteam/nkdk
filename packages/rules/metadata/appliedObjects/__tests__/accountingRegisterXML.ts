import { canonicalXML } from "../../../tests/canonicalXML"

export function canonicalAccountingRegisterXML(value: string): unknown {
  return normalizeExtDimensions(canonicalXML(value))
}

function normalizeExtDimensions(value: unknown, key?: string): unknown {
  if (Array.isArray(value)) {
    const normalized = value.map((child) => normalizeExtDimensions(child))
    if (key !== "xr:StandardAttribute") return normalized

    const indexes = normalized.flatMap((item, index) => (isExtDimension(item) ? [index] : []))
    const items = indexes
      .map((index) => normalized[index])
      .sort((left, right) => standardAttributeName(left).localeCompare(standardAttributeName(right)))
    indexes.forEach((index, itemIndex) => {
      normalized[index] = items[itemIndex]
    })
    return normalized
  }
  const record = asRecord(value)
  if (record === undefined) return value
  return Object.fromEntries(
    Object.entries(record).map(([childKey, child]) => [childKey, normalizeExtDimensions(child, childKey)])
  )
}

function isExtDimension(value: unknown): boolean {
  return /^ExtDimension(?:Type)?\d+$/.test(standardAttributeName(value))
}

function standardAttributeName(value: unknown): string {
  const name = asRecord(value)?._name
  return typeof name === "string" ? name : ""
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
