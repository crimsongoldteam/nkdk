import {
  copyYAMLMappingTag,
  copyYAMLScalarTags,
  markYAMLMappingTag,
  markYAMLScalarTag,
  xmlAnomalyTagPayload,
  xmlAnomalyTagValue,
  yamlMappingTagOf,
  yamlScalarTagAt,
  type ConfigurationContext,
} from "@nkdk/runtime"
import type { I8nTextLanguageXML } from "./types"

export function importLocalizedItems(params: {
  context: ConfigurationContext
  items: readonly I8nTextLanguageXML[]
}): Record<string, string> {
  const { context, items } = params
  if (items.some((item) => item["v8:lang"] === "" || item["v8:lang"] === "#")) {
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
      if (normalizedContent(next["v8:content"]) !== content || items[index + 2]?.["v8:lang"] === code) {
        throw unsupportedDuplicate(code)
      }
      if (!context.languages.registeredSet.has(code)) {
        throw new Error(`Неподдерживаемый повтор незарегистрированного языка ${JSON.stringify(code)}`)
      }
      if (seen.has(code)) throw unsupportedDuplicate(code)

      result[code] = xmlAnomalyTagValue("xml/duplicate", content)
      markYAMLScalarTag(result, code, "xml/duplicate")
      seen.add(code)
      codes.push(code)
      index += 2
      continue
    }

    if (seen.has(code)) throw unsupportedDuplicate(code)
    result[code] = content
    seen.add(code)
    codes.push(code)
    if (!context.languages.registeredSet.has(code)) {
      result[code] = xmlAnomalyTagValue("xml/language", content)
      markYAMLScalarTag(result, code, "xml/language")
    }
    index += 1
  }

  if (!isCanonicalLanguageOrder(codes, context.languages.default)) {
    markYAMLMappingTag(result, "xml/order")
  }
  return result
}

export function exportLocalizedItems(params: {
  context: ConfigurationContext
  items: Record<string, string>
}): I8nTextLanguageXML[] {
  const { context, items } = params
  const sourceCodes = Object.keys(items)
  const codes =
    yamlMappingTagOf(items) === "xml/order" || sourceCodes.some((code) => code === "" || code === "#")
      ? sourceCodes
      : canonicalCodes(sourceCodes, context.languages.default)
  const result: I8nTextLanguageXML[] = []

  for (const code of codes) {
    const stored = items[code] ?? ""
    if (stored === "") continue
    const tag = yamlScalarTagAt(items, code)
    const content =
      tag === "xml/language" || tag === "xml/duplicate"
        ? xmlAnomalyTagPayload(tag, stored)
        : stored
    const item = { "v8:lang": code, "v8:content": content }
    result.push(item)
    if (tag === "xml/duplicate") result.push({ ...item })
  }

  return result
}

export function isCanonicalLanguageOrder(codes: readonly string[], defaultCode: string): boolean {
  const uniqueCodes = codes.filter((code, index) => code !== codes[index - 1])
  return uniqueCodes.every((code, index) => code === canonicalCodes(uniqueCodes, defaultCode)[index])
}

export function copyLocalizedItemTags(source: Record<string, string>, target: Record<string, string>): void {
  copyYAMLScalarTags(source, target)
  copyYAMLMappingTag(source, target)
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
  for (const item of items) {
    result[item["v8:lang"] ?? ""] = normalizedContent(item["v8:content"])
  }
  return result
}

function normalizedContent(content: unknown): string {
  return content != null && content !== "" ? String(content) : ""
}

function unsupportedDuplicate(code: string): Error {
  return new Error(`Неподдерживаемый повтор языка ${JSON.stringify(code)}`)
}
