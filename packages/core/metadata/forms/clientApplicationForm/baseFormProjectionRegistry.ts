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

const projectors = new Map<PropertyRuleType, BaseFormPropertyProjector>()

export function registerBaseFormPropertyProjector(
  type: PropertyRuleType,
  projector: BaseFormPropertyProjector
): void {
  projectors.set(type, projector)
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
