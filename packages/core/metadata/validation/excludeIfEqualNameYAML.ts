import type { ConfigurationContext } from "~/metadata/context/types"
import { findExcludedEqualNameYAMLOccurrence } from "~/metadata/helpers/excludeIfEqualNameYAML"
import { getTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import type { Diagnostic } from "./types"
import { diagnosticAtYamlPath, type YamlPath } from "./yamlLocations"

export interface ValidateExcludedEqualNameYAMLParams {
  context: ConfigurationContext
  filePath: string
  parsed: ParsedYaml
  rule: MetadataItemRule
  name: string | undefined
}

export function validateExcludedEqualNameYAML(params: ValidateExcludedEqualNameYAMLParams): Diagnostic[] {
  return validateObject({
    ...params,
    value: params.parsed.data,
    yamlPath: [],
  })
}

function validateObject(
  params: ValidateExcludedEqualNameYAMLParams & {
    value: unknown
    yamlPath: YamlPath
  }
): Diagnostic[] {
  const record = asRecord(params.value)
  if (!record) return []

  const diagnostics: Diagnostic[] = []
  for (const propRule of Object.values(params.rule.properties)) {
    if (typeof propRule.yaml !== "string") continue

    const yamlValue = record[propRule.yaml]
    if (yamlValue === undefined) continue

    const propertyPath = [...params.yamlPath, propRule.yaml]
    const occurrence = findExcludedEqualNameYAMLOccurrence({
      context: params.context,
      rule: propRule,
      value: yamlValue,
      name: params.name,
      path: propertyPath,
    })

    if (occurrence) {
      diagnostics.push(
        diagnosticAtYamlPath({
          filePath: params.filePath,
          parsed: params.parsed,
          path: occurrence.path,
          severity: "error",
          source: "structure",
          message: equalNameMessage(propRule, params.name),
        })
      )
    }

    const itemRule = nestedItemRule(propRule)
    if (!itemRule) continue

    diagnostics.push(
      ...validateNestedItems({
        ...params,
        value: yamlValue,
        itemRule,
        yamlPath: propertyPath,
      })
    )
  }

  return diagnostics
}

function validateNestedItems(
  params: ValidateExcludedEqualNameYAMLParams & {
    value: unknown
    itemRule: MetadataItemRule
    yamlPath: YamlPath
  }
): Diagnostic[] {
  if (Array.isArray(params.value)) {
    return params.value.flatMap((item, index) =>
      validateObject({
        ...params,
        rule: params.itemRule,
        value: item,
        name: itemNameFromYAML(params.itemRule, item),
        yamlPath: [...params.yamlPath, index],
      })
    )
  }

  const record = asRecord(params.value)
  if (!record) return []

  return Object.entries(record).flatMap(([key, item]) =>
    validateObject({
      ...params,
      rule: params.itemRule,
      value: item,
      name: key,
      yamlPath: [...params.yamlPath, key],
    })
  )
}

function nestedItemRule(propRule: PropertyRule): MetadataItemRule | undefined {
  const collectionItemRule = getTypeRule(propRule.type, "collectionItemRule")
  if (collectionItemRule?.itemRule) return collectionItemRule.itemRule

  if ("itemRule" in propRule && propRule.itemRule !== undefined) {
    return propRule.itemRule as MetadataItemRule
  }

  return undefined
}

function itemNameFromYAML(rule: MetadataItemRule, value: unknown): string | undefined {
  const record = asRecord(value)
  if (!record) return undefined

  const nameRule = rule.properties.name
  const nameYamlKey = typeof nameRule?.yaml === "string" ? nameRule.yaml : undefined
  if (nameYamlKey !== undefined && typeof record[nameYamlKey] === "string") return record[nameYamlKey]

  return typeof record.name === "string" ? record.name : undefined
}

function equalNameMessage(rule: PropertyRule, name: string | undefined): string {
  const yamlName = typeof rule.yaml === "string" ? rule.yaml : "Поле"
  return name
    ? `Поле "${yamlName}" не нужно указывать, если его значение совпадает с именем "${name}"`
    : `Поле "${yamlName}" не нужно указывать, если его значение совпадает с именем элемента`
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
