import { getTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { MetadataItem, MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import type { ProjectMetadataResolver } from "./projectMetadataResolver"
import type { Diagnostic } from "./types"
import type { YamlPath } from "./yamlLocations"

export interface ValidateMetadataTargetsInModelParams {
  filePath: string
  parsed: ParsedYaml
  model: MetadataItem
  rule: MetadataItemRule
  resolver: ProjectMetadataResolver
}

export function validateMetadataTargetsInModel(params: ValidateMetadataTargetsInModelParams): Diagnostic[] {
  return validateObject({
    ...params,
    value: params.model,
    yamlPath: [],
  })
}

function validateObject(
  params: ValidateMetadataTargetsInModelParams & { value: unknown; yamlPath: YamlPath },
): Diagnostic[] {
  const record = asRecord(params.value)
  if (!record) return []

  const diagnostics: Diagnostic[] = []
  for (const [propertyName, propRule] of Object.entries(params.rule.properties)) {
    if (typeof propRule.yaml !== "string") continue
    if (!propRule.metadataTarget) continue

    const value = record[propertyName]
    if (value === undefined) continue

    const handler = getTypeRule(propRule.type, "validateMetadataTarget")
    if (!handler) continue

    diagnostics.push(
      ...handler({
        filePath: params.filePath,
        parsed: params.parsed,
        yamlPath: [...params.yamlPath, propRule.yaml],
        propRule,
        propertyName,
        value,
        resolver: params.resolver,
      }),
    )
  }

  return diagnostics
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined
}
