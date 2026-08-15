import type { ConfigurationLanguages } from "../context/types"
import { yamlMappingKeys, yamlMappingTagOf } from "../../yaml/mappingTags"
import { isXMLAnomalyTag, yamlScalarTagAt, type YAMLScalarTag } from "../../yaml/scalarTags"
import type { YamlPath } from "../diagnostics/types"

export interface LocalizedTextYAMLIssue {
  readonly path: YamlPath
  readonly message: string
}

export function validateLocalizedTextYAMLProperty(params: {
  readonly languages: ConfigurationLanguages
  readonly value: unknown
  readonly valueTag?: YAMLScalarTag
  readonly path: YamlPath
  readonly foldable: boolean
}): LocalizedTextYAMLIssue[] {
  const { languages, value, valueTag, path, foldable } = params
  if (typeof value === "string") {
    return !isXMLAnomalyTag(valueTag)
      ? []
      : [{ path, message: `Тег !${valueTag} недопустим у скалярной локализованной строки` }]
  }

  const items = asRecord(value)
  if (items === undefined) return []
  const codes = yamlMappingKeys(items)
  if (codes.includes("") || codes.includes("#")) return []

  const issues: LocalizedTextYAMLIssue[] = []
  const hasOrderTag = yamlMappingTagOf(items) === "xml/order"
  const defaultMarker = items[languages.default] === ""

  for (const code of codes) {
    const itemPath = [...path, code]
    const itemValue = items[code]
    const tag = yamlScalarTagAt(items, code)
    const registered = languages.registeredSet.has(code)

    if (isXMLAnomalyTag(tag) && tag !== "xml/language" && tag !== "xml/duplicate") {
      issues.push({ path: itemPath, message: `Тег !${tag} недопустим у языка локализованной строки` })
      continue
    }

    if (itemValue === "") {
      if (!foldable || code !== languages.default) {
        issues.push({ path: itemPath, message: "Пустое значение языка не представляет XML-текст" })
      } else if (codes[0] !== code) {
        issues.push({ path: itemPath, message: "Маркер отсутствующего основного языка должен быть первым" })
      } else if (hasOrderTag) {
        issues.push({ path: itemPath, message: "Маркер отсутствующего основного языка избыточен при !xml/order" })
      }
      continue
    }

    if (tag === "xml/duplicate" && !registered) {
      issues.push({ path: itemPath, message: `Тег !xml/duplicate недопустим для незарегистрированного языка ${code}` })
      continue
    }
    if (tag === "xml/language" && registered) {
      issues.push({ path: itemPath, message: `Тег !xml/language избыточен для зарегистрированного языка ${code}` })
      continue
    }
    if (!registered && tag !== "xml/language") {
      issues.push({ path: itemPath, message: `Незарегистрированный язык ${code} требует тег !xml/language` })
    }
  }

  const explicitCodes = codes.filter((code) => items[code] !== "")
  const effectiveCodes =
    foldable && !defaultMarker && !hasOrderTag && !explicitCodes.includes(languages.default)
      ? [languages.default, ...explicitCodes]
      : explicitCodes
  const canonical = isCanonicalLanguageOrder(effectiveCodes, languages.default)
  if (hasOrderTag === canonical) {
    issues.push({
      path,
      message: hasOrderTag
        ? "Тег !xml/order избыточен для канонического порядка языков"
        : "Порядок языков неканонический и требует тег !xml/order",
    })
  }

  return issues
}

function isCanonicalLanguageOrder(codes: readonly string[], defaultCode: string): boolean {
  let sawDefault = false
  let previousOther: string | undefined
  for (const code of codes) {
    if (code === defaultCode) {
      if (sawDefault || previousOther !== undefined) return false
      sawDefault = true
    } else if (previousOther !== undefined && previousOther >= code) {
      return false
    } else {
      previousOther = code
    }
  }
  return true
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}
