import { getTypeRule } from "../orchestration/property/typeRuleRegistry"
import type { MetadataTargetOwner } from "../commonObjects/metadataTargets"
import type { MetadataItem, MetadataItemRule } from "../orchestration/property/types"
import type { ParsedYaml } from "../../yaml/parseMetadataYaml"
import type { ProjectMetadataResolver } from "./projectMetadataResolver"
import type { Diagnostic } from "./types"
import type { YamlPath } from "./yamlLocations"

export interface ValidateMetadataTargetsInModelParams {
  filePath: string
  parsed: ParsedYaml
  model: MetadataItem
  rule: MetadataItemRule
  resolver: ProjectMetadataResolver
  owner?: MetadataTargetOwner
}

export function validateMetadataTargetsInModel(params: ValidateMetadataTargetsInModelParams): Diagnostic[] {
  return validateObject({
    ...params,
    value: params.model,
    yamlPath: [],
  })
}

function validateObject(
  params: ValidateMetadataTargetsInModelParams & { value: unknown; yamlPath: YamlPath }
): Diagnostic[] {
  const record = asRecord(params.value)
  if (!record) return []

  const diagnostics: Diagnostic[] = []
  for (const [propertyName, propRule] of Object.entries(params.rule.properties)) {
    if (typeof propRule.yaml !== "string") continue

    const value = record[propertyName]
    if (value === undefined) continue

    if (propRule.metadataTarget) {
      const handler = getTypeRule(propRule.type, "validateMetadataTarget")
      if (handler) {
        diagnostics.push(
          ...handler({
            filePath: params.filePath,
            parsed: params.parsed,
            yamlPath: [...params.yamlPath, propRule.yaml],
            propRule,
            propertyName,
            value,
            resolver: params.resolver,
            owner: params.owner,
          })
        )
      }
    }

    const itemRule = nestedItemRule(propRule)
    if (!itemRule) continue

    diagnostics.push(
      ...validateNestedItems({
        ...params,
        value,
        itemRule,
        yamlPath: [...params.yamlPath, propRule.yaml],
      })
    )
  }

  return diagnostics
}

function validateNestedItems(
  params: ValidateMetadataTargetsInModelParams & {
    value: unknown
    itemRule: MetadataItemRule
    yamlPath: YamlPath
  }
): Diagnostic[] {
  if (Array.isArray(params.value)) {
    return params.value.flatMap((item, index) =>
      validateObject({
        ...params,
        value: item,
        rule: params.itemRule,
        yamlPath: [...params.yamlPath, nestedItemPathSegment(item, index)],
      })
    )
  }

  const record = asRecord(params.value)
  if (!record) return []

  return Object.entries(record).flatMap(([key, item]) =>
    validateObject({
      ...params,
      value: item,
      rule: params.itemRule,
      yamlPath: [...params.yamlPath, key],
    })
  )
}

function nestedItemRule(propRule: MetadataItemRule["properties"][string]): MetadataItemRule | undefined {
  const collectionItemRule = getTypeRule(propRule.type, "collectionItemRule")
  if (collectionItemRule?.itemRule) return collectionItemRule.itemRule

  if ("itemRule" in propRule && propRule.itemRule !== undefined) {
    return propRule.itemRule as MetadataItemRule
  }

  return undefined
}

function nestedItemPathSegment(item: unknown, index: number): string | number {
  const record = asRecord(item)
  return typeof record?.name === "string" ? record.name : index
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined
}
