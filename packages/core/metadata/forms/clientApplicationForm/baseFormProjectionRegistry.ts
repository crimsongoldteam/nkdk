import type { PropertyRule } from "../../orchestration/property/types"
import type { PropertyRuleType } from "../../orchestration/property/registry"

export interface BaseFormProjectionContext {
  readonly attributeNames: ReadonlySet<string>
  readonly commandNames: ReadonlySet<string>
  readonly parameterNames: ReadonlySet<string>
}

export type BaseFormPropertyProjection =
  | { readonly kind: "include"; readonly value: unknown }
  | { readonly kind: "omit" }

export interface BaseFormPropertyProjector {
  project(params: {
    readonly rule: PropertyRule
    readonly baseValue: unknown
    readonly extensionValue: unknown
    readonly context: BaseFormProjectionContext
  }): BaseFormPropertyProjection
}

export type BaseFormStructuredProjectionRule =
  | {
      readonly kind: "object"
      readonly properties?: Readonly<Record<string, BaseFormStructuredProjectionRule>>
      readonly requiredProperties?: readonly string[]
      readonly omitIfEmpty?: true
    }
  | {
      readonly kind: "array"
      readonly item: BaseFormStructuredProjectionRule
      readonly omitIfEmpty?: true
    }
  | {
      readonly kind: "reference"
      readonly type: PropertyRuleType
    }
  | {
      readonly kind: "intersection"
    }

export interface BaseFormReferenceProjector {
  project(params: {
    readonly baseValue: unknown
    readonly extensionValue: unknown
    readonly context: BaseFormProjectionContext
  }): BaseFormPropertyProjection
}

const projectors = new Map<PropertyRuleType, BaseFormPropertyProjector>()
const referenceProjectors = new Map<
  PropertyRuleType,
  BaseFormReferenceProjector
>()

export function registerBaseFormPropertyProjector(
  type: PropertyRuleType,
  projector: BaseFormPropertyProjector
): void {
  projectors.set(type, projector)
}

export function registerBaseFormReferenceProjector(
  type: PropertyRuleType,
  projector: BaseFormReferenceProjector
): void {
  referenceProjectors.set(type, projector)
}

export function createStructuredBaseFormPropertyProjector(
  rule: BaseFormStructuredProjectionRule
): BaseFormPropertyProjector {
  return {
    project: ({ baseValue, extensionValue, context }) =>
      projectStructuredValue({
        baseValue,
        extensionValue,
        context,
        rule,
      }),
  }
}

export function projectProperty(params: {
  readonly rule: PropertyRule
  readonly baseValue: unknown
  readonly extensionValue: unknown
  readonly context: BaseFormProjectionContext
}): BaseFormPropertyProjection {
  const projector = projectors.get(params.rule.type)
  if (projector !== undefined) return projector.project(params)

  if (isUnavailableLocalReference(params)) {
    throw new Error(
      `Property type "${params.rule.type}" does not define BaseForm projection for an unavailable reference`
    )
  }

  return { kind: "include", value: params.baseValue }
}

export function intersectBaseFormValues(
  baseValue: unknown,
  extensionValue: unknown
): unknown {
  if (Array.isArray(baseValue) && Array.isArray(extensionValue)) {
    const length = Math.min(baseValue.length, extensionValue.length)
    return Array.from(
      { length },
      (_, index) =>
        intersectBaseFormValues(
          baseValue[index],
          extensionValue[index]
        )
    )
  }

  const baseYaml = asYamlRecord(baseValue)
  const extensionYaml = asYamlRecord(extensionValue)
  if (baseYaml === undefined || extensionYaml === undefined) return baseValue

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(baseYaml)) {
    if (!Object.hasOwn(extensionYaml, key)) continue
    result[key] = intersectBaseFormValues(value, extensionYaml[key])
  }
  return result
}

function projectStructuredValue(params: {
  readonly baseValue: unknown
  readonly extensionValue: unknown
  readonly context: BaseFormProjectionContext
  readonly rule: BaseFormStructuredProjectionRule
}): BaseFormPropertyProjection {
  if (params.rule.kind === "intersection") {
    return {
      kind: "include",
      value: intersectBaseFormValues(
        params.baseValue,
        params.extensionValue
      ),
    }
  }

  if (params.rule.kind === "reference") {
    const projector = referenceProjectors.get(params.rule.type)
    if (projector === undefined) {
      throw new Error(
        `Property type "${params.rule.type}" does not define BaseForm reference projection`
      )
    }
    return projector.project(params)
  }

  if (params.rule.kind === "array") {
    if (
      !Array.isArray(params.baseValue) ||
      !Array.isArray(params.extensionValue)
    ) {
      return { kind: "omit" }
    }
    const value: unknown[] = []
    const length = Math.min(
      params.baseValue.length,
      params.extensionValue.length
    )
    for (let index = 0; index < length; index += 1) {
      const item = projectStructuredValue({
        baseValue: params.baseValue[index],
        extensionValue: params.extensionValue[index],
        context: params.context,
        rule: params.rule.item,
      })
      if (item.kind === "include") value.push(item.value)
    }
    return value.length === 0 && params.rule.omitIfEmpty === true
      ? { kind: "omit" }
      : { kind: "include", value }
  }

  const baseYaml = asYamlRecord(params.baseValue)
  const extensionYaml = asYamlRecord(params.extensionValue)
  if (baseYaml === undefined || extensionYaml === undefined) {
    return { kind: "omit" }
  }
  const value: Record<string, unknown> = {}
  const required = new Set(params.rule.requiredProperties ?? [])
  for (const [key, basePropertyValue] of Object.entries(baseYaml)) {
    if (!Object.hasOwn(extensionYaml, key)) continue
    const property = projectStructuredValue({
      baseValue: basePropertyValue,
      extensionValue: extensionYaml[key],
      context: params.context,
      rule:
        params.rule.properties?.[key] ??
        { kind: "intersection" },
    })
    if (property.kind === "omit") {
      if (required.has(key)) return { kind: "omit" }
      continue
    }
    value[key] = property.value
  }
  if (
    [...required].some((key) => !Object.hasOwn(value, key)) ||
    (
      Object.keys(value).length === 0 &&
      params.rule.omitIfEmpty === true
    )
  ) {
    return { kind: "omit" }
  }
  return { kind: "include", value }
}

function isUnavailableLocalReference(params: {
  readonly rule: PropertyRule
  readonly baseValue: unknown
  readonly context: BaseFormProjectionContext
}): boolean {
  if (typeof params.baseValue !== "string" || params.baseValue === "" || params.baseValue === "0") return false
  const baseValue = params.baseValue

  const target = params.rule.metadataTarget
  if (target?.kind !== "member" || target.owner !== "this" || target.memberKinds === undefined) return false

  const localTargets: ReadonlySet<string>[] = []
  if (target.memberKinds.includes("Attribute")) localTargets.push(params.context.attributeNames)
  if (target.memberKinds.includes("Command")) localTargets.push(params.context.commandNames)
  return localTargets.length > 0 && localTargets.every((names) => !names.has(baseValue))
}

function asYamlRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
