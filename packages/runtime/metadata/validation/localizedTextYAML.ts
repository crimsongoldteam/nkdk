import type { ConfigurationLanguages } from "../context/types"
import { yamlMappingKeys } from "../../yaml/mappingTags"
import { xmlAnnotatedMappingEntries, type XmlAnomalyAnnotations } from "../../yaml/xmlAnomalyAnnotations"
import type { YAMLScalarTag } from "../../yaml/scalarTags"
import type { YamlPath } from "../diagnostics/types"

export interface LocalizedTextYAMLIssue {
  readonly path: YamlPath
  readonly message: string
}

export function validateLocalizedTextYAMLProperty(params: {
  readonly languages: ConfigurationLanguages
  readonly value: unknown
  readonly valueTag?: YAMLScalarTag
  readonly annotations?: XmlAnomalyAnnotations
  readonly path: YamlPath
  readonly foldable: boolean
}): LocalizedTextYAMLIssue[] {
  const { languages, value, path, foldable } = params
  if (typeof value === "string") return []

  const items = asRecord(value)
  if (items === undefined) return []
  const entries = params.annotations === undefined
    ? yamlMappingKeys(items).map((code) => [code, items[code]] as const)
    : xmlAnnotatedMappingEntries(items, params.annotations)
  const codes = entries.map(([code]) => code)
  if (codes.includes("") || codes.includes("#")) return []

  const issues: LocalizedTextYAMLIssue[] = []
  if (!isCanonicalLanguageOrder(codes, languages.default)) {
    issues.push({ path, message: "Неканонический порядок языков локализованного текста" })
  }
  for (const [code, itemValue] of entries) {
    const itemPath = [...path, code]
    const registered = languages.registeredSet.has(code)

    if (itemValue === "") {
      if (!foldable || code !== languages.default) {
        issues.push({ path: itemPath, message: "Пустое значение языка не представляет XML-текст" })
      } else if (codes[0] !== code) {
        issues.push({ path: itemPath, message: "Маркер отсутствующего основного языка должен быть первым" })
      }
      continue
    }
    if (!registered) issues.push({ path: itemPath, message: `Незарегистрированный язык ${code}` })
  }

  return issues
}

export function isCanonicalLanguageOrder(codes: readonly string[], defaultCode: string): boolean {
  const uniqueCodes = [...new Set(codes)]
  const canonical = [
    ...(uniqueCodes.includes(defaultCode) ? [defaultCode] : []),
    ...uniqueCodes.filter((code) => code !== defaultCode).sort(codeCompare),
  ]
  return uniqueCodes.every((code, index) => code === canonical[index])
}

function codeCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}
