import {
  typeboxErrorsToValidationIssues,
  type ValidationIssue,
  type ValidationSchemaError,
  type ValidationSchemaValidator,
  type XmlAnomalyAnnotations,
} from "@nkdk/runtime"
import type { MetadataItemRule, PropertyRule } from "@nkdk/runtime/rule-kit"
import { traverseMetadataRuleYaml } from "./metadataRuleYamlTraversal"

export interface MetadataRuleValidator {
  validate(params: {
    readonly yaml: unknown
    readonly annotations: XmlAnomalyAnnotations
    readonly rule: MetadataItemRule
  }): ValidationIssue[]
}

export function createMetadataRuleValidator(params: {
  readonly propertyValidator: (rule: PropertyRule) => ValidationSchemaValidator | undefined
}): MetadataRuleValidator {
  const validators = new WeakMap<PropertyRule, ValidationSchemaValidator>()
  const withoutValidator = new WeakSet<PropertyRule>()

  const validatorFor = (rule: PropertyRule): ValidationSchemaValidator | undefined => {
    const cached = validators.get(rule)
    if (cached !== undefined) return cached
    if (withoutValidator.has(rule)) return undefined
    const compiled = params.propertyValidator(rule)
    if (compiled === undefined) withoutValidator.add(rule)
    else validators.set(rule, compiled)
    return compiled
  }

  return {
    validate(input) {
      const issues: ValidationIssue[] = []
      traverseMetadataRuleYaml({
        yaml: input.yaml,
        rule: input.rule,
        initialState: undefined,
        onObject({ yaml, rule, yamlPath }) {
          validateObject({
            yaml,
            rule,
            yamlPath,
            annotations: input.annotations,
            validatorFor,
            issues,
          })
        },
      })
      return issues
    },
  }
}

function validateObject(params: {
  readonly yaml: unknown
  readonly rule: MetadataItemRule
  readonly yamlPath: readonly (string | number)[]
  readonly annotations: XmlAnomalyAnnotations
  readonly validatorFor: (rule: PropertyRule) => ValidationSchemaValidator | undefined
  readonly issues: ValidationIssue[]
}): void {
  if (!isRecord(params.yaml)) return
  const rulesByYamlKey = new Map(
    Object.values(params.rule.properties).flatMap((rule) =>
      typeof rule.yaml === "string" && rule.fromYAML !== false && rule.runtimeOnly !== true
        ? [[rule.yaml, rule] as const]
        : []),
  )
  const occurrences = new Map<string, number>()

  for (const [runtimeKey, value] of Object.entries(params.yaml)) {
    const keyAnnotation = params.annotations.keyAt(params.yaml, runtimeKey)
    const logicalKey = keyAnnotation?.logicalKey ?? runtimeKey
    const occurrence = occurrences.get(logicalKey) ?? 0
    occurrences.set(logicalKey, occurrence + 1)
    const valueAnnotation = params.annotations.at(params.yaml, runtimeKey)
    const propertyRule = rulesByYamlKey.get(logicalKey)
    const targetPath = [...params.yamlPath, logicalKey]

    if (propertyRule === undefined) {
      if (valueAnnotation?.kind === "raw" && valueAnnotation.xml !== undefined) continue
      params.issues.push({
        code: "rules.unknown-property",
        kind: "semantic",
        target: occurrence === 0
          ? { kind: "path", path: targetPath }
          : { kind: "occurrence", path: targetPath, occurrence },
        params: { property: logicalKey },
      })
      continue
    }

    if (occurrence > 0) {
      params.issues.push({
        code: "rules.duplicate-property",
        kind: "semantic",
        target: { kind: "occurrence", path: targetPath, occurrence },
        params: { property: logicalKey },
      })
    }
    if (valueAnnotation?.kind === "raw") {
      if (valueAnnotation.xml === undefined) {
        params.issues.push({
          code: "xml/raw-xml-required",
          kind: "semantic",
          target: { kind: "path", path: targetPath },
        })
      }
      if (valueAnnotation.hasSemanticValue !== true) continue
    }
    const validator = params.validatorFor(propertyRule)
    if (validator === undefined) continue
    const [, errors] = validator.Errors(value)
    const localErrors = errors.filter(isLocalPropertyError)
    const localIssues = typeboxErrorsToValidationIssues(localErrors, targetPath)
    params.issues.push(...(occurrence === 0
      ? localIssues
      : localIssues.map((issue) => ({
          ...issue,
          target: { kind: "occurrence" as const, path: targetPath, occurrence },
        }))))
  }

  for (const [yamlKey, propertyRule] of rulesByYamlKey) {
    if (propertyRule.required !== true || occurrences.has(yamlKey)) continue
    params.issues.push({
      code: "rules.required",
      kind: "semantic",
      target: { kind: "missing", path: [...params.yamlPath, yamlKey] },
      params: { property: yamlKey },
    })
  }
}

function isLocalPropertyError(error: ValidationSchemaError): boolean {
  return error.instancePath === "" || error.instancePath === "/"
    || error.keyword === "propertyNames"
    || error.keyword === "uniqueItems"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
