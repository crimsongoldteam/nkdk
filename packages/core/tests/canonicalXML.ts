import { importContentFromXML } from "../xml/import/importer"

export function canonicalXML(value: string): unknown {
  return removeFormattingText(importContentFromXML(value.replace(/^\uFEFF/, "")))
}

export function canonicalSnapshot13XML(value: string): unknown {
  return normalizeSnapshot13Collections(canonicalXML(value))
}

function normalizeSnapshot13Collections(value: unknown, key?: string): unknown {
  if (Array.isArray(value)) {
    const normalized = value.map((child) => normalizeSnapshot13Collections(child))
    if (key === "Event" || key === "xr:StandardAttribute") {
      normalized.sort((left, right) => collectionItemKey(left).localeCompare(collectionItemKey(right)))
    }
    return normalized
  }
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([childKey, child]) => [
      childKey,
      normalizeSnapshot13Collections(child, childKey),
    ])
  )
}

function collectionItemKey(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  const item = value as Record<string, unknown>
  return [item._name, item._callType, item["#text"]].join("\u0000")
}

function removeFormattingText(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(removeFormattingText)
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
      key === "#text" && typeof child === "string" && child.trim() === "" ? [] : [[key, removeFormattingText(child)]]
    )
  )
}
