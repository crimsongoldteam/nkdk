import {
  copyYAMLMappingKeyOrder,
  markYAMLMappingKeyOrder,
  yamlMappingKeys,
  type ConfigurationContext,
} from "@nkdk/runtime"
import type { I8nTextLanguageXML } from "./types"

export function importLocalizedItems(params: {
  context: ConfigurationContext
  items: readonly I8nTextLanguageXML[]
}): Record<string, string> {
  const { items } = params
  if (items.some((item) =>
    typeof item !== "object" || item === null ||
    item["v8:lang"] === undefined || item["v8:lang"] === "" || item["v8:lang"] === "#")) {
    return importLegacyItems(items)
  }

  const result: Record<string, string> = {}
  const codes: string[] = []
  const seen = new Set<string>()

  for (let index = 0; index < items.length; ) {
    const current = items[index]!
    const code = current["v8:lang"]
    const content = normalizedContent(current["v8:content"])
    const next = items[index + 1]

    if (next?.["v8:lang"] === code) {
      if (seen.has(code)) throw unsupportedDuplicate(code)
      setLocalizedValue(result, code, content)
      seen.add(code)
      codes.push(code)
      index += 2
      continue
    }

    if (seen.has(code)) throw unsupportedDuplicate(code)
    setLocalizedValue(result, code, content)
    seen.add(code)
    codes.push(code)
    index += 1
  }

  markYAMLMappingKeyOrder(result, codes)

  return result
}

export function exportLocalizedItems(params: {
  context: ConfigurationContext
  items: Record<string, string>
  emptyDefaultIsMarker?: boolean
}): I8nTextLanguageXML[] {
  const { context, items } = params
  const sourceCodes = yamlMappingKeys(items)
  const codes = sourceCodes
  const result: I8nTextLanguageXML[] = []

  for (const code of codes) {
    const stored = items[code] ?? ""
    if (stored === "" && params.emptyDefaultIsMarker === true && code === context.languages.default) continue
    const item = { "v8:lang": code, "v8:content": stored }
    result.push(item)
  }

  return result
}

export function isCanonicalLanguageOrder(codes: readonly string[], defaultCode: string): boolean {
  const uniqueCodes = codes.filter((code, index) => code !== codes[index - 1])
  return uniqueCodes.every((code, index) => code === canonicalCodes(uniqueCodes, defaultCode)[index])
}

export function copyLocalizedItemTags(source: Record<string, string>, target: Record<string, string>): void {
  copyYAMLMappingKeyOrder(source, target)
}

function canonicalCodes(codes: readonly string[], defaultCode: string): string[] {
  const unique = [...new Set(codes)]
  return [
    ...(unique.includes(defaultCode) ? [defaultCode] : []),
    ...unique.filter((code) => code !== defaultCode).sort(codeCompare),
  ]
}

function codeCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function importLegacyItems(items: readonly I8nTextLanguageXML[]): Record<string, string> {
  const result: Record<string, string> = {}
  const codes: string[] = []
  for (const item of items) {
    if (typeof item !== "object" || item === null) {
      setLocalizedValue(result, "", "")
      codes.push("")
      continue
    }
    const code = item["v8:lang"] ?? ""
    setLocalizedValue(result, code, normalizedContent(item["v8:content"]))
    codes.push(code)
  }
  markYAMLMappingKeyOrder(result, codes)
  return result
}

function setLocalizedValue(target: Record<string, string>, code: string, value: string): void {
  Object.defineProperty(target, code, {
    configurable: true,
    enumerable: true,
    writable: true,
    value,
  })
}

function normalizedContent(content: unknown): string {
  return content != null && content !== "" ? String(content) : ""
}

function unsupportedDuplicate(code: string): Error {
  return new Error(`Неподдерживаемый повтор языка ${JSON.stringify(code)}`)
}
