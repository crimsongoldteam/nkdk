import {
  copyYAMLMappingKeyOrder,
  markYAMLMappingKeyOrder,
  yamlMappingKeys,
  type ConfigurationContext,
} from "@nkdk/runtime"
import type { I8nTextLanguageXML } from "./types"

export interface LocalizedItemOccurrence {
  readonly language: string
  readonly content: string
}

const localizedOccurrences = new WeakMap<object, readonly LocalizedItemOccurrence[]>()

export function importLocalizedItems(params: {
  context: ConfigurationContext
  items: readonly I8nTextLanguageXML[]
}): Record<string, string> {
  const { items } = params
  const result: Record<string, string> = {}
  const seen = new Set<string>()
  const occurrences: LocalizedItemOccurrence[] = []

  for (const item of items) {
    const language = localizedLanguage(item)
    const content = localizedContent(item)
    occurrences.push({ language, content })
    if (seen.has(language)) continue
    setLocalizedValue(result, language, content)
    seen.add(language)
  }

  markLocalizedItemOccurrences(result, occurrences)

  return result
}

export function localizedItemOccurrences(
  items: Record<string, string>,
): readonly LocalizedItemOccurrence[] {
  return localizedOccurrences.get(items) ?? yamlMappingKeys(items).map((language) => ({
    language,
    content: items[language] ?? "",
  }))
}

export function markLocalizedItemOccurrences(
  items: Record<string, string>,
  occurrences: readonly LocalizedItemOccurrence[],
): void {
  localizedOccurrences.set(items, occurrences.map((occurrence) => ({ ...occurrence })))
  const codes: string[] = []
  const seen = new Set<string>()
  for (const { language } of occurrences) {
    if (seen.has(language)) continue
    codes.push(language)
    seen.add(language)
  }
  for (const language of Object.keys(items)) {
    if (seen.has(language)) continue
    codes.push(language)
    seen.add(language)
  }
  markYAMLMappingKeyOrder(items, codes)
}

export function exportLocalizedItems(params: {
  context: ConfigurationContext
  items: Record<string, string>
  emptyDefaultIsMarker?: boolean
}): I8nTextLanguageXML[] {
  const { context, items } = params
  const result: I8nTextLanguageXML[] = []

  for (const { language, content } of localizedItemOccurrences(items)) {
    if (content === "" && params.emptyDefaultIsMarker === true && language === context.languages.default) continue
    const item = { "v8:lang": language, "v8:content": content }
    result.push(item)
  }

  return result
}

export function copyLocalizedItemTags(source: Record<string, string>, target: Record<string, string>): void {
  copyYAMLMappingKeyOrder(source, target)
  const sourceOccurrences = localizedOccurrences.get(source)
  if (sourceOccurrences === undefined) return
  const targetLanguages = new Set(Object.keys(target))
  const copied = sourceOccurrences.filter(({ language }) => targetLanguages.has(language))
  const copiedLanguages = new Set(copied.map(({ language }) => language))
  for (const language of yamlMappingKeys(target)) {
    if (copiedLanguages.has(language)) continue
    copied.push({ language, content: target[language] ?? "" })
    copiedLanguages.add(language)
  }
  markLocalizedItemOccurrences(target, copied)
}

function localizedLanguage(item: I8nTextLanguageXML): string {
  return typeof item === "object" && item !== null ? item["v8:lang"] ?? "" : ""
}

function localizedContent(item: I8nTextLanguageXML): string {
  return typeof item === "object" && item !== null ? normalizedContent(item["v8:content"]) : ""
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
