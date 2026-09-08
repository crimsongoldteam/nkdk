import { Type } from "typebox"
import {
  compileValidationSchema,
  parsedYamlFromKnownData,
  validateRuleYAMLObjectProperties,
  validationIssuePathFromPointer,
  prepareYAMLDocumentData,
  isPropertyStateYAMLTag,
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
import { currentOperationRegistrySet } from "../operations/operationExecutionContext"
import type { PropertyStateCapabilityRegistry } from "../ruleRuntime/definition"
import { exportBorrowedPropertyStateSchema } from "../ruleRuntime/property/propertyStateSchema"

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
    readonly name?: string
    readonly deferRequired?: boolean
    readonly onLocalizedTextProperty?: (path: readonly (string | number)[]) => void
  }): ValidationIssue[]
}

interface BoundaryRulePlan {
  readonly rulesByYamlKey: ReadonlyMap<string, PropertyRule>
  readonly requiredYamlKeys: readonly string[]
}

export function createMetadataRuleValidator(params: {
  readonly propertyValidator: (
    rule: PropertyRule,
    ownerRule: MetadataItemRule,
  ) => ValidationSchemaValidator | undefined
  readonly isKnownProperty?: (rule: MetadataItemRule, key: string) => boolean
  readonly objectValidator?: (rule: MetadataItemRule) => ValidationSchemaValidator | undefined
  readonly validateRequired?: boolean
  readonly validateUnknownProperties?: boolean
}): MetadataRuleValidator {
  const validators = new WeakMap<MetadataItemRule, WeakMap<PropertyRule, ValidationSchemaValidator | null>>()
  const objectValidators = new WeakMap<MetadataItemRule, ValidationSchemaValidator>()
  const boundaryPlans = new WeakMap<MetadataItemRule, BoundaryRulePlan>()
  const boundaryPlanFor = (rule: MetadataItemRule): BoundaryRulePlan => {
    const cached = boundaryPlans.get(rule)
    if (cached !== undefined) return cached
    const rulesByYamlKey = new Map(Object.values(rule.properties).flatMap(property =>
      typeof property.yaml === "string" && property.fromYAML !== false
        ? [[property.yaml, property] as const] : []))
    const plan = {
      rulesByYamlKey,
      requiredYamlKeys: [...rulesByYamlKey].flatMap(([key, property]) => property.required === true && property.runtimeOnly !== true ? [key] : []),
    }
    boundaryPlans.set(rule, plan)
    return plan
  }

  const validatorFor = (rule: PropertyRule, ownerRule: MetadataItemRule): ValidationSchemaValidator | undefined => {
    let byProperty = validators.get(ownerRule)
    if (byProperty === undefined) validators.set(ownerRule, byProperty = new WeakMap())
    const cached = byProperty.get(rule)
    if (cached !== undefined) return cached ?? undefined
    const compiled = params.propertyValidator(rule, ownerRule)
    byProperty.set(rule, compiled ?? null)
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
            boundaryPlanFor,
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
        boundaryPlanFor,
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
  const propertyStates = currentOperationRegistrySet<{
    readonly propertyStates: PropertyStateCapabilityRegistry
  }>()?.propertyStates
  const borrowedSchemas = new WeakMap<MetadataItemRule, ValidationSchemaValidator>()
  const schemaPropertyNames = new WeakMap<MetadataItemRule, ReadonlySet<string>>()
  const extensionComponent = "fromXML" in params.context
    && (params.context.fromXML as { readonly componentKind?: string }).componentKind === "configurationExtension"
  const validator = createMetadataRuleValidator({
    validateRequired: false,
    validateUnknownProperties: false,
    isKnownProperty: (rule, key) => schemaPropertyNames.get(rule)?.has(key) ?? true,
    objectValidator(rule) {
      const source = runtime.exportRule({
        context: params.context,
        rule,
        explicitXMLValues: true,
        excludeImplicitValueYAML: true,
      })
      if ("properties" in source && isRecord(source.properties)) {
        const names = new Set(Object.keys(source.properties))
        const definition = params.rules.schemas.get(rule.itemType)
        if (definition?.source === rule) {
          const registered = runtime.exportDefinition({
            context: params.context, definition,
            explicitXMLValues: true, excludeImplicitValueYAML: true,
          })
          if ("properties" in registered && isRecord(registered.properties)) {
            for (const key of Object.keys(registered.properties)) names.add(key)
          }
        }
        schemaPropertyNames.set(rule, names)
      }
      // Обязательность берём из общей схемы (с учётом неявных значений),
      // но содержимое уже завершённых дочерних объектов не проверяем повторно.
      const required = "required" in source && Array.isArray(source.required)
        ? source.required.filter((key): key is string => typeof key === "string") : []
      return compileValidationSchema({}, Type.Object({}, { required, additionalProperties: true }))
    },
    propertyValidator(rule, ownerRule) {
      if (params.rules.execution.getTypeRule(rule.type, "nestedItemRule") !== undefined) return undefined
      const propertyKey = Object.entries(ownerRule.properties)
        .find(([, candidate]) => candidate === rule)?.[0]
      if (
        propertyKey !== undefined &&
        params.rules.execution.isDependentImportProperty(ownerRule.itemType, propertyKey)
      ) return undefined
      const capability = extensionComponent
        ? propertyStates?.item(
            ownerRule.itemType,
            "fromXML" in params.context
              ? (params.context.fromXML as { readonly propertyStateCompatibilityMode?: string }).propertyStateCompatibilityMode
              : undefined,
          )
        : undefined
      if (capability !== undefined && typeof rule.yaml === "string") {
        let compiled = borrowedSchemas.get(ownerRule)
        if (compiled === undefined) {
          const graph = runtime.exportGraph({
            context: params.context,
            roots: [{ key: "item", rule: ownerRule, includeNestedChildItems: true }],
            explicitXMLValues: true,
            validationPropertyRefs: true,
            excludeImplicitValueYAML: true,
          })
          compiled = compileValidationSchema(graph.schemas, exportBorrowedPropertyStateSchema({
            rule: ownerRule,
            capability,
            source: graph.roots.item!,
            closed: false,
          }))
          borrowedSchemas.set(ownerRule, compiled)
        }
        return propertyValueValidator(compiled, rule.yaml)
      }
      const yamlKey = rule.yaml ?? "$значение"
      const localRule: MetadataItemRule = {
        itemType: `LocalValidation:${rule.type}`,
        properties: {
          value: { ...rule, yaml: yamlKey, required: true },
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
      return propertyValueValidator(compiled, yamlKey)
    },
  })
  return {
    ...validator,
    validateBoundary(input) {
      const structural = validateRuleYAMLObjectProperties({
        context: params.context,
        filePath: "",
        parsed: parsedYamlFromKnownData("", input.yaml, input.annotations),
        rule: input.rule,
        value: input.yaml,
        yamlPath: input.yamlPath,
        name: input.name,
        onLocalizedTextProperty: input.onLocalizedTextProperty,
      })
      return [...validator.validateBoundary(input), ...structural.map((diagnostic): ValidationIssue => ({
        code: "diagnostic.structure",
        kind: "semantic",
        target: { kind: "path", path: validationIssuePathFromPointer(diagnostic.path ?? "") },
        params: { message: diagnostic.message },
      }))]
    },
  }
}

function propertyValueValidator(compiled: ValidationSchemaValidator, yamlKey: string): ValidationSchemaValidator {
  const prefix = `/${escapeJsonPointerSegment(yamlKey)}`
  return {
    Check: value => compiled.Check({ [yamlKey]: value }),
    Errors(value) {
      const [, errors] = compiled.Errors({ [yamlKey]: value })
      const local = errors.flatMap(error => {
        if (error.instancePath === prefix) return [{ ...error, instancePath: "" }]
        if (!error.instancePath.startsWith(`${prefix}/`)) return []
        return [{ ...error, instancePath: error.instancePath.slice(prefix.length) }]
      })
      return [local.length === 0, local]
    },
  }
}

function validateObject(params: {
  readonly yaml: unknown
  readonly rule: MetadataItemRule
  readonly yamlPath: readonly (string | number)[]
  readonly annotations: XmlAnomalyAnnotations
  readonly name?: string
  readonly deferRequired?: boolean
  readonly validatorFor: (
    rule: PropertyRule,
    ownerRule: MetadataItemRule,
  ) => ValidationSchemaValidator | undefined
  readonly boundaryPlanFor: (rule: MetadataItemRule) => BoundaryRulePlan
  readonly isKnownProperty?: (rule: MetadataItemRule, key: string) => boolean
  readonly objectValidatorFor: (rule: MetadataItemRule) => ValidationSchemaValidator | undefined
  readonly validateRequired?: boolean
  readonly validateUnknownProperties?: boolean
  readonly issues: ValidationIssue[]
}): void {
  if (!isRecord(params.yaml)) return
  const objectValidator = params.objectValidatorFor(params.rule)
  if (objectValidator !== undefined && params.deferRequired !== true) {
    const [, errors] = objectValidator.Errors(params.yaml)
    const nameKey = params.name === undefined ? undefined : params.rule.properties.name?.yaml
    params.issues.push(...typeboxErrorsToValidationIssues(
      errors.filter(isLocalPropertyError).flatMap((error) =>
        filterKnownAdditionalProperties(error, params.rule, params.isKnownProperty)),
      params.yamlPath,
    ).filter(issue => !(nameKey !== undefined && issue.target.kind === "missing" && issue.target.path.at(-1) === nameKey)))
  }
  const { rulesByYamlKey, requiredYamlKeys } = params.boundaryPlanFor(params.rule)
  const occurrences = new Map<string, number>()

  for (const [runtimeKey, value] of Object.entries(params.yaml)) {
    const keyAnnotation = params.annotations.keyAt(params.yaml, runtimeKey)
    const logicalKey = keyAnnotation?.logicalKey ?? runtimeKey
    const occurrence = occurrences.get(logicalKey) ?? 0
    occurrences.set(logicalKey, occurrence + 1)
    const valueAnnotation = params.annotations.at(params.yaml, runtimeKey)
    const propertyRule = rulesByYamlKey.get(logicalKey)
    const targetPath = [...params.yamlPath, logicalKey]

    if (propertyRule === undefined || (propertyRule.runtimeOnly === true && params.isKnownProperty?.(params.rule, logicalKey) === false)) {
      if (propertyRule === undefined && params.validateUnknownProperties === false) continue
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
    const scalarTag = yamlScalarTagAt(params.yaml, runtimeKey)
    if (scalarTag === "xml/standard-attributes" || isPropertyStateYAMLTag(scalarTag)) continue
    const validator = params.validatorFor(propertyRule, params.rule)
    if (validator === undefined) continue
    const semanticValue = value !== null && typeof value === "object"
      ? prepareYAMLDocumentData(value, params.annotations).data : value
    const [, errors] = validator.Errors(semanticValue)
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
    for (const yamlKey of requiredYamlKeys) {
      if (occurrences.has(yamlKey)) continue
      params.issues.push({
        code: "rules.required",
        kind: "semantic",
        target: { kind: "missing", path: [...params.yamlPath, yamlKey] },
        params: { property: yamlKey },
      })
    }
  }
}

function escapeJsonPointerSegment(value: string): string {
  return value.replaceAll("~", "~0").replaceAll("/", "~1")
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
