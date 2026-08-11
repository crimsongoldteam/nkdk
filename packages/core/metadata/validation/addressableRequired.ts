import type { ParsedYaml } from "../../yaml/parseMetadataYaml"
import type { MetadataItemRule } from "../ruleRuntime/property/types"
import { shouldProcessProperty } from "../ruleRuntime/property/helpers"
import type { ValidationPendingCheck } from "./projectValidationPendingChecks"
import { traverseMetadataRuleYaml } from "./metadataRuleYamlTraversal"
import { yamlDiagnosticLocationAtPath } from "./yamlLocations"

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
    rule: params.rule,
    initialState: { boundaryTarget: params.canonicalTarget, checkBoundary: true },
    onObject: ({ yaml, rule, yamlPath, state }) => {
      if (!state.checkBoundary) return
      const record = asRecord(yaml) ?? {}
      const missing = Object.entries(rule.properties)
        .filter(([propertyKey, propertyRule]) =>
          propertyKey !== "name" &&
          propertyRule.required === true &&
          typeof propertyRule.yaml === "string" &&
          shouldProcessProperty({ rule: propertyRule, operation: "importFromYAML" }) &&
          !Object.hasOwn(record, propertyRule.yaml)
        )
        .map(([, propertyRule]) => propertyRule.yaml as string)
      if (missing.length === 0) return
      checks.push({
        kind: "addressableRequired",
        yamlPath,
        location: yamlDiagnosticLocationAtPath({
          filePath: params.filePath,
          parsed: params.parsed,
          path: yamlPath,
        }),
        canonicalTarget: state.boundaryTarget,
        missing,
      })
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
