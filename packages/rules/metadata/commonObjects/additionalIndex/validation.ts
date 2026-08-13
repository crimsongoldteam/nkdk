import type { DependentYamlItemHandler } from "../../ruleRuntime/property/dependentItemRegistry"
import { diagnosticAtYamlPath } from "../../validation/yamlLocations"
import type { ParsedYaml } from "@nkdk/runtime"

const indexedFieldsKey = "ИндексируемыеПоля"
const additionalFieldsKey = "ДополнительныеПоля"

export const analyzeAdditionalIndexItem: DependentYamlItemHandler = (params) => {
  const indexed = stringItems(params.item[indexedFieldsKey])
  const additional = stringItems(params.item[additionalFieldsKey])
  const repeated = repeatedValues([...indexed, ...additional])
  const diagnostics = repeated.map((field) => diagnosticAtYamlPath({
    filePath: params.filePath,
    parsed: params.parsed as ParsedYaml,
    path: params.itemYamlPath,
    source: "structure",
    severity: "error",
    message: `Поле «${field}» повторяется в дополнительном индексе`,
  }))

  if (indexed.length + additional.length > 16) {
    diagnostics.push(diagnosticAtYamlPath({
      filePath: params.filePath,
      parsed: params.parsed as ParsedYaml,
      path: params.itemYamlPath,
      source: "structure",
      severity: "error",
      message: "Дополнительный индекс содержит больше 16 полей",
    }))
  }

  return { diagnostics, references: [], projectChecks: [] }
}

function stringItems(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function repeatedValues(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const repeated = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) repeated.add(value)
    seen.add(value)
  }
  return [...repeated]
}
