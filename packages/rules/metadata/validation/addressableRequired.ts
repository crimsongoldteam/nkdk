import type { ParsedYaml } from "@nkdk/runtime"
import type { MetadataItemRule } from "../ruleRuntime/property/types"
import { shouldProcessProperty } from "../ruleRuntime/property/helpers"
import type { ValidationPendingCheck } from "./projectValidationPendingChecks"
import { traverseMetadataRuleYaml } from "./metadataRuleYamlTraversal"
import { yamlDiagnosticLocationAtPath } from "./yamlLocations"

const requiredKeys = new WeakMap<MetadataItemRule, readonly string[]>()

/** Собственные обязательные поля: значения вложенных объектов не читаются. */
export function collectAddressableBoundaryRequiredCheck(params: {
  readonly filePath: string
  readonly parsed: ParsedYaml
  readonly yaml: unknown
  readonly rule: MetadataItemRule
  readonly yamlPath: readonly (string | number)[]
  readonly canonicalTarget: string
}): Extract<ValidationPendingCheck, { kind: "addressableRequired" }> | undefined {
  let keys = requiredKeys.get(params.rule)
  if (keys === undefined) {
    keys = Object.entries(params.rule.properties).flatMap(([key, rule]) =>
      key !== "name" && rule.required === true && typeof rule.yaml === "string"
      && shouldProcessProperty({ rule, operation: "importFromYAML" }) ? [rule.yaml] : [])
    requiredKeys.set(params.rule, keys)
  }
  const record = asRecord(params.yaml) ?? {}
  const missing = keys.filter(key => !Object.hasOwn(record, key))
  if (missing.length === 0) return undefined
  return {
    kind: "addressableRequired", yamlPath: params.yamlPath, canonicalTarget: params.canonicalTarget, missing,
    location: yamlDiagnosticLocationAtPath({ filePath: params.filePath, parsed: params.parsed, path: params.yamlPath }),
  }
}

export function collectAddressableRequiredChecks(params: {
  readonly filePath: string
  readonly parsed: ParsedYaml
  readonly yaml: unknown
  readonly rule: MetadataItemRule
  readonly canonicalTarget: string
}): Extract<ValidationPendingCheck, { kind: "addressableRequired" }>[] {
  const checks: Extract<ValidationPendingCheck, { kind: "addressableRequired" }>[] = []
  traverseMetadataRuleYaml({
    yaml: params.yaml,
    annotations: params.parsed.annotations,
    rule: params.rule,
    initialState: { boundaryTarget: params.canonicalTarget, checkBoundary: true },
    onObject: ({ yaml, rule, yamlPath, state }) => {
      if (!state.checkBoundary) return
      const check = collectAddressableBoundaryRequiredCheck({
        ...params, yaml, rule, yamlPath, canonicalTarget: state.boundaryTarget,
      })
      if (check !== undefined) checks.push(check)
    },
    enterNestedObject: ({ state }) => ({ ...state, checkBoundary: false }),
    enterCollectionItem: ({ rule, itemName, state }) => {
      const externalMetadata = rule.externalMetadata
      if (externalMetadata === undefined || itemName === undefined) {
        return { ...state, checkBoundary: false }
      }
      return {
        boundaryTarget: `${state.boundaryTarget}.${externalMetadata.segment}.${itemName}`,
        checkBoundary: true,
      }
    },
  })
  return checks
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}
