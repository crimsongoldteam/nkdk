import { parseConnection } from "./parseConnection"
import type { ParsedRecord, ParsedV8i } from "./types"

export function parseV8i(text: string, source: string, sourceOrder: number): ParsedV8i {
  const records: ParsedRecord[] = []
  const warnings: ParsedV8i["warnings"] = []
  let section: { name: string; fields: Record<string, string>; recordOrder: number } | undefined
  let sectionOrder = 0

  const finish = () => {
    if (section === undefined) return
    const lowerFields = new Map(Object.entries(section.fields).map(([key, value]) => [key.toLowerCase(), value]))
    const rawConnection = lowerFields.get("connect")
    const common = {
      name: section.name,
      folder: lowerFields.get("folder") || "/",
      ...(numeric(lowerFields.get("orderintree")) === undefined
        ? {}
        : { orderInTree: numeric(lowerFields.get("orderintree")) }),
      fields: section.fields,
      source,
      sourceOrder,
      recordOrder: section.recordOrder,
    }
    if (rawConnection !== undefined) {
      if (rawConnection.trim() === "") {
        warnings.push({ code: "invalid-section", source, message: `Пустой Connect в разделе ${section.name}` })
      } else {
        records.push({
          ...common,
          kind: "infobase",
          ...(lowerFields.get("id") ? { id: lowerFields.get("id") } : {}),
          connection: parseConnection(rawConnection),
          rawConnection,
          ...(lowerFields.get("version") ? { version: lowerFields.get("version") } : {}),
          ...(lowerFields.get("defaultversion") ? { defaultVersion: lowerFields.get("defaultversion") } : {}),
          ...(lowerFields.get("app") ? { app: lowerFields.get("app") } : {}),
        })
      }
    } else {
      records.push({ ...common, kind: "folder" })
    }
  }

  for (const rawLine of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line === "") continue
    if (line.startsWith("[") && line.endsWith("]")) {
      finish()
      section = { name: line.slice(1, -1), fields: {}, recordOrder: sectionOrder }
      sectionOrder += 1
      continue
    }
    if (section === undefined) continue
    const separator = line.indexOf("=")
    if (separator < 1) {
      warnings.push({ code: "invalid-section", source, message: `Некорректная строка: ${line}` })
      continue
    }
    section.fields[line.slice(0, separator).trim()] = line.slice(separator + 1).trim()
  }
  finish()
  return { records, warnings }
}

function numeric(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") return undefined
  const result = Number(value)
  return Number.isFinite(result) ? result : undefined
}
