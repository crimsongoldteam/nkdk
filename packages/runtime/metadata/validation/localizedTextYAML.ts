import type { ConfigurationLanguages } from "../context/types"
import { yamlMappingKeys } from "../../yaml/mappingTags"
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
  readonly path: YamlPath
  readonly foldable: boolean
}): LocalizedTextYAMLIssue[] {
  const { languages, value, path, foldable } = params
  if (typeof value === "string") return []

  const items = asRecord(value)
  if (items === undefined) return []
  const codes = yamlMappingKeys(items)
  if (codes.includes("") || codes.includes("#")) return []

  const issues: LocalizedTextYAMLIssue[] = []
  for (const code of codes) {
    const itemPath = [...path, code]
    const itemValue = items[code]
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

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}
