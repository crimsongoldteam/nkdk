import { importContentFromXML } from "../xml/import/importer"

export function canonicalXML(value: string): unknown {
  return removeFormattingText(importContentFromXML(value.replace(/^\uFEFF/, "")))
}

function removeFormattingText(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(removeFormattingText)
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
      key === "#text" && typeof child === "string" && child.trim() === ""
        ? []
        : [[key, removeFormattingText(child)]]
    )
  )
}
