import {
  compileValidationSchema,
  typeboxErrorsToValidationIssues,
  yamlScalarTagAt,
  type ConfigurationContext,
  type ValidationIssue,
  type ValidationSchemaError,
  type ValidationSchemaValidator,
  type XmlAnomalyAnnotations,
} from "@nkdk/runtime"
import {
  createRuleSchemaRuntime,
  type MetadataItemRule,
  type PropertyRule,
  type RuleRegistrySet,
} from "@nkdk/runtime/rule-kit"
import { traverseMetadataRuleYaml } from "./metadataRuleYamlTraversal"

export interface MetadataRuleValidator {
  validate(params: {
    readonly yaml: unknown
    readonly annotations: XmlAnomalyAnnotations
    readonly rule: MetadataItemRule
  }): ValidationIssue[]
  validateBoundary(params: {
    readonly yaml: unknown
    readonly annotations: XmlAnomalyAnnotations
    readonly rule: MetadataItemRule
    readonly yamlPath: readonly (string | number)[]
  }): ValidationIssue[]
}

export function createMetadataRuleValidator(params: {
  readonly propertyValidator: (rule: PropertyRule) => ValidationSchemaValidator | undefined
  readonly isKnownProperty?: (rule: MetadataItemRule, key: string) => boolean
  readonly objectValidator?: (rule: MetadataItemRule) => ValidationSchemaValidator | undefined
  readonly validateRequired?: boolean
  readonly validateUnknownProperties?: boolean
}): MetadataRuleValidator {
  const validators = new WeakMap<PropertyRule, ValidationSchemaValidator>()
  const withoutValidator = new WeakSet<PropertyRule>()
  const objectValidators = new WeakMap<MetadataItemRule, ValidationSchemaValidator>()

  const validatorFor = (rule: PropertyRule): ValidationSchemaValidator | undefined => {
    const cached = validators.get(rule)
    if (cached !== undefined) return cached
    if (withoutValidator.has(rule)) return undefined
    const compiled = params.propertyValidator(rule)
    if (compiled === undefined) withoutValidator.add(rule)
    else validators.set(rule, compiled)
    return compiled
  }
  const objectValidatorFor = (rule: MetadataItemRule): ValidationSchemaValidator | undefined => {
    const cached = objectValidators.get(rule)
    if (cached !== undefined) return cached
    const compiled = params.objectValidator?.(rule)
    if (compiled !== undefined) objectValidators.set(rule, compiled)
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
            isKnownProperty: params.isKnownProperty,
            objectValidatorFor,
            validateRequired: params.validateRequired,
            validateUnknownProperties: params.validateUnknownProperties,
            issues,
          })
        },
      })
      return issues
    },
    validateBoundary(input) {
      const issues: ValidationIssue[] = []
      validateObject({
        ...input,
        validatorFor,
        isKnownProperty: params.isKnownProperty,
        objectValidatorFor,
        validateRequired: params.validateRequired,
        validateUnknownProperties: params.validateUnknownProperties,
        issues,
      })
      return issues
    },
  }
}

/** Собирает локальные проверки свойств из того же schema runtime, что и проверка проекта. */
export function createRegisteredMetadataRuleValidator(params: {
  readonly context: ConfigurationContext
  readonly rules: RuleRegistrySet
}): MetadataRuleValidator {
  const runtime = createRuleSchemaRuntime(
    params.rules,
    (name, available) => new Error(`Неизвестная JSON Schema "${name}". Доступные имена: ${available.join(", ")}`),
  )
  return createMetadataRuleValidator({
    validateRequired: false,
    validateUnknownProperties: false,
    propertyValidator(rule) {
      if (params.rules.execution.getTypeRule(rule.type, "nestedItemRule") !== undefined) return undefined
      const localRule: MetadataItemRule = {
        itemType: `LocalValidation:${rule.type}`,
        properties: {
          value: { ...rule, yaml: "$значение", required: true },
        },
      }
      const graph = runtime.exportGraph({
        context: params.context,
        roots: [{ key: "property", rule: localRule, includeNestedChildItems: true }],
        explicitXMLValues: true,
        validationPropertyRefs: true,
        excludeImplicitValueYAML: true,
      })
      const compiled = compileValidationSchema(graph.schemas, graph.roots.property!)
      return {
        Check(value) {
          return compiled.Check({ $значение: value })
        },
        Errors(value) {
          const [, errors] = compiled.Errors({ $значение: value })
          const local = errors.flatMap((error) => {
            if (error.instancePath === "/$значение") return [{ ...error, instancePath: "" }]
            if (!error.instancePath.startsWith("/$значение/")) return []
            return [{ ...error, instancePath: error.instancePath.slice("/$значение".length) }]
          })
          return [local.length === 0, local]
        },
      }
    },
  })
}

function validateObject(params: {
  readonly yaml: unknown
  readonly rule: MetadataItemRule
  readonly yamlPath: readonly (string | number)[]
  readonly annotations: XmlAnomalyAnnotations
  readonly validatorFor: (rule: PropertyRule) => ValidationSchemaValidator | undefined
  readonly isKnownProperty?: (rule: MetadataItemRule, key: string) => boolean
  readonly objectValidatorFor: (rule: MetadataItemRule) => ValidationSchemaValidator | undefined
  readonly validateRequired?: boolean
  readonly validateUnknownProperties?: boolean
  readonly issues: ValidationIssue[]
}): void {
  if (!isRecord(params.yaml)) return
  const objectValidator = params.objectValidatorFor(params.rule)
  if (objectValidator !== undefined) {
    const [, errors] = objectValidator.Errors(params.yaml)
    params.issues.push(...typeboxErrorsToValidationIssues(
      errors.filter(isLocalPropertyError).flatMap((error) =>
        filterKnownAdditionalProperties(error, params.rule, params.isKnownProperty)),
      params.yamlPath,
    ))
  }
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
      if (params.validateUnknownProperties === false) continue
      if (params.isKnownProperty?.(params.rule, logicalKey) === true) continue
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
    if (yamlScalarTagAt(params.yaml, runtimeKey) === "xml/standard-attributes") continue
    const validator = params.validatorFor(propertyRule)
    if (validator === undefined) continue
    const [, errors] = validator.Errors(value)
    const localErrors = errors.filter((error) =>
      isLocalPropertyError(error) || error.keyword === "anyOf" || error.keyword === "oneOf")
    const localIssues = typeboxErrorsToValidationIssues(localErrors, targetPath)
    params.issues.push(...(occurrence === 0
      ? localIssues
      : localIssues.map((issue) => ({
          ...issue,
          target: { kind: "occurrence" as const, path: targetPath, occurrence },
        }))))
  }

  if (objectValidator === undefined && params.validateRequired !== false) {
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
}

function filterKnownAdditionalProperties(
  error: ValidationSchemaError,
  rule: MetadataItemRule,
  isKnownProperty: ((rule: MetadataItemRule, key: string) => boolean) | undefined,
): ValidationSchemaError[] {
  if (error.keyword !== "additionalProperties" || isKnownProperty === undefined) return [error]
  const additional = error.params["additionalProperties"]
  if (!Array.isArray(additional)) return [error]
  const unknown = additional.filter((key): key is string =>
    typeof key === "string" && !isKnownProperty(rule, key))
  return unknown.length === 0 ? [] : [{ ...error, params: { ...error.params, additionalProperties: unknown } }]
}

function isLocalPropertyError(error: ValidationSchemaError): boolean {
  return error.instancePath === "" || error.instancePath === "/"
    || error.keyword === "propertyNames"
    || error.keyword === "uniqueItems"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
