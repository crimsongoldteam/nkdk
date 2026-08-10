import type { ParsedYaml } from "../../yaml/parseMetadataYaml"
import { getTypeRule } from "../ruleRuntime/property/typeRuleRegistry"
import type { MetadataItemRule, PropertyRule } from "../ruleRuntime/property/types"
import { shouldProcessProperty } from "../ruleRuntime/property/helpers"
import type { ValidationPendingCheck } from "./projectValidationPendingChecks"
import { yamlDiagnosticLocationAtPath, type YamlPath } from "./yamlLocations"

export function collectAddressableRequiredChecks(params: {
  readonly filePath: string
  readonly parsed: ParsedYaml
  readonly yaml: unknown
  readonly rule: MetadataItemRule
  readonly canonicalTarget: string
}): Extract<ValidationPendingCheck, { kind: "addressableRequired" }>[] {
  const checks: Extract<ValidationPendingCheck, { kind: "addressableRequired" }>[] = []
  collectObject({
    ...params,
    yamlPath: [],
    boundaryTarget: params.canonicalTarget,
    checkBoundary: true,
    checks,
  })
  return checks
}

function collectObject(params: {
  readonly filePath: string
  readonly parsed: ParsedYaml
  readonly yaml: unknown
  readonly rule: MetadataItemRule
  readonly yamlPath: YamlPath
  readonly boundaryTarget: string
  readonly checkBoundary: boolean
  readonly checks: Extract<ValidationPendingCheck, { kind: "addressableRequired" }>[]
}): void {
  const record = asRecord(params.yaml)
  if (record === undefined) return

  if (params.checkBoundary) {
    const missing = Object.values(params.rule.properties)
      .filter((propertyRule) =>
        propertyRule.required === true &&
        typeof propertyRule.yaml === "string" &&
        shouldProcessProperty({ rule: propertyRule, operation: "importFromYAML" }) &&
        !Object.hasOwn(record, propertyRule.yaml)
      )
      .map((propertyRule) => propertyRule.yaml as string)
    if (missing.length > 0) {
      params.checks.push({
        kind: "addressableRequired",
        yamlPath: params.yamlPath,
        location: yamlDiagnosticLocationAtPath({
          filePath: params.filePath,
          parsed: params.parsed,
          path: params.yamlPath,
        }),
        canonicalTarget: params.boundaryTarget,
        missing,
      })
    }
  }

  for (const propertyRule of Object.values(params.rule.properties)) {
    if (typeof propertyRule.yaml !== "string" || !Object.hasOwn(record, propertyRule.yaml)) continue
    collectNested({
      ...params,
      propertyRule,
      yaml: record[propertyRule.yaml],
      yamlPath: [...params.yamlPath, propertyRule.yaml],
    })
  }
}

function collectNested(params: {
  readonly filePath: string
  readonly parsed: ParsedYaml
  readonly yaml: unknown
  readonly rule: MetadataItemRule
  readonly propertyRule: PropertyRule
  readonly yamlPath: YamlPath
  readonly boundaryTarget: string
  readonly checks: Extract<ValidationPendingCheck, { kind: "addressableRequired" }>[]
}): void {
  const nested = getTypeRule(params.propertyRule.type, "yamlToXMLNestedRule")
  if (nested === undefined || nested.kind === "externalFile") return
  if (nested.kind === "item") {
    const itemRule = nested.itemRuleFromProperty?.(params.propertyRule) ?? nested.itemRule
    collectObject({ ...params, rule: itemRule, checkBoundary: false })
    return
  }
  if (nested.kind === "polymorphicRecord") {
    const record = asRecord(params.yaml)
    if (record !== undefined) {
      collectObject({
        ...params,
        rule: nested.resolveItemRule({ yaml: record, name: "" }),
        checkBoundary: false,
      })
    }
    return
  }

  const fallbackRule = nested.itemRuleFromProperty?.(params.propertyRule) ?? nested.itemRule
  if (Array.isArray(params.yaml)) {
    params.yaml.forEach((item, index) => {
      const itemRule = nested.resolveItemRule?.({
        yaml: item,
        name: undefined,
        index,
        propertyRule: params.propertyRule,
      }) ?? fallbackRule
      collectObject({
        ...params,
        yaml: item,
        rule: itemRule,
        yamlPath: [...params.yamlPath, index],
        checkBoundary: false,
      })
    })
    return
  }

  const record = asRecord(params.yaml)
  if (record === undefined) return
  let index = 0
  for (const [yamlKey, item] of Object.entries(record)) {
    const itemName = nested.nameFromYAMLKeyForProperty?.({ yamlKey, propertyRule: params.propertyRule })
      ?? nested.nameFromYAMLKey?.(yamlKey)
      ?? yamlKey
    const itemRule = nested.resolveItemRule?.({
      yaml: item,
      name: itemName,
      index,
      propertyRule: params.propertyRule,
    }) ?? fallbackRule
    const addressable = itemRule.externalMetadata !== undefined
    collectObject({
      ...params,
      yaml: item,
      rule: itemRule,
      yamlPath: [...params.yamlPath, yamlKey],
      boundaryTarget: addressable
        ? `${params.boundaryTarget}.${itemRule.externalMetadata!.segment}.${itemName}`
        : params.boundaryTarget,
      checkBoundary: addressable,
    })
    index += 1
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}
