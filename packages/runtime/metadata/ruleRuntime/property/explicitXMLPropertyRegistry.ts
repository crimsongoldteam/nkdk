import {
  EMPTY_XML_TAG_VALUE,
  xmlScalarTagPayload,
  yamlScalarTagAt,
} from "../../../yaml/scalarTags"
import { currentPropertyRuleRegistrySet } from "./propertyRuleExecutionContext"

export type ExplicitXMLPropertyRegistration =
  | {
      readonly action?: "emit"
      readonly itemType: string
      readonly propertyKey: string
      readonly xmlValue: unknown
      readonly yamlValue: unknown
    }
  | {
      readonly action: "omit"
      readonly itemType: string
      readonly propertyKey: string
      readonly yamlValue: typeof EMPTY_XML_TAG_VALUE
    }
  | {
      readonly action: "transportScalar"
      readonly itemType: string
      readonly propertyKey: string
      readonly overrides?: Readonly<Record<string, unknown>>
    }

export interface ExplicitXMLPropertyTypeRegistration {
  readonly action: "materializeCollection"
  readonly propertyType: string
  readonly yamlValue: typeof EMPTY_XML_TAG_VALUE
}

export type ExplicitXMLPropertyAction =
  | { readonly kind: "emit"; readonly xmlValue: unknown }
  | { readonly kind: "omit" }
  | { readonly kind: "useYamlValue"; readonly yamlValue: string }
  | { readonly kind: "materializeCollection" }
  | { readonly kind: "invalid"; readonly message: string }

export interface ExplicitXMLPropertyMatcher {
  matchExplicitXMLPropertyFromXML(params: {
    readonly itemType: string
    readonly propertyKey: string
    readonly presentInXML: boolean
    readonly xmlValue: unknown
  }): Exclude<
    ExplicitXMLPropertyRegistration,
    { readonly action: "transportScalar" }
  > | undefined
  matchExplicitXMLPropertyTypeFromXML(params: {
    readonly propertyType: string
    readonly presentInXML: boolean
    readonly yamlValue: unknown
  }): ExplicitXMLPropertyTypeRegistration | undefined
}

export interface ExplicitXMLPropertyRegistryView {
  readonly properties: ReadonlyMap<string, ExplicitXMLPropertyRegistration>
  readonly propertyTypes: ReadonlyMap<string, ExplicitXMLPropertyTypeRegistration>
}

interface ContextualExplicitXMLPropertyRegistry extends ExplicitXMLPropertyMatcher {
  collectExplicitXMLPropertyActions(params: {
    readonly yaml: unknown
    readonly itemType: string
    readonly properties: Readonly<Record<string, { readonly type?: string; readonly yaml?: string }>>
  }): ReadonlyMap<string, ExplicitXMLPropertyAction>
  hasExplicitXMLProperty(itemType: string, propertyKey: string): boolean
  explicitXMLPropertyValidationMode(
    itemType: string,
    propertyKey: string,
    propertyType?: string,
  ): "empty" | "scalar" | undefined
}

export function registerExplicitXMLProperty(registration: ExplicitXMLPropertyRegistration): void {
  const registry = currentPropertyRuleRegistrySet<{
    registerExplicitXMLProperty(value: ExplicitXMLPropertyRegistration): void
  }>()
  if (registry === undefined) throw new Error("Не задан execution context property rules")
  registry.registerExplicitXMLProperty(registration)
}

export function registerExplicitXMLPropertyType(registration: ExplicitXMLPropertyTypeRegistration): void {
  const registry = currentPropertyRuleRegistrySet<{
    registerExplicitXMLPropertyType(value: ExplicitXMLPropertyTypeRegistration): void
  }>()
  if (registry === undefined) throw new Error("Не задан execution context property rules")
  registry.registerExplicitXMLPropertyType(registration)
}

export function matchExplicitXMLPropertyFromXML(params: {
  readonly itemType: string
  readonly propertyKey: string
  readonly presentInXML: boolean
  readonly xmlValue: unknown
}): Exclude<ExplicitXMLPropertyRegistration, { readonly action: "transportScalar" }> | undefined {
  const contextual = currentPropertyRuleRegistrySet<ContextualExplicitXMLPropertyRegistry>()
  return contextual?.matchExplicitXMLPropertyFromXML(params)
}

export function matchExplicitXMLPropertyTypeFromXML(params: {
  readonly propertyType: string
  readonly presentInXML: boolean
  readonly yamlValue: unknown
}): ExplicitXMLPropertyTypeRegistration | undefined {
  const contextual = currentPropertyRuleRegistrySet<ContextualExplicitXMLPropertyRegistry>()
  return contextual?.matchExplicitXMLPropertyTypeFromXML(params)
}

export function collectExplicitXMLPropertyActions(params: {
  readonly yaml: unknown
  readonly itemType: string
  readonly properties: Readonly<Record<string, { readonly type?: string; readonly yaml?: string }>>
}, registry?: ExplicitXMLPropertyRegistryView): ReadonlyMap<string, ExplicitXMLPropertyAction> {
  const contextual = currentPropertyRuleRegistrySet<ContextualExplicitXMLPropertyRegistry>()
  if (registry === undefined) {
    if (contextual === undefined) throw new Error("Не задан execution context property rules")
    return contextual.collectExplicitXMLPropertyActions(params)
  }
  const actions = new Map<string, ExplicitXMLPropertyAction>()
  if (typeof params.yaml !== "object" || params.yaml === null || Array.isArray(params.yaml)) return actions
  const yaml = params.yaml as Record<string, unknown>
  for (const [propertyKey, rule] of Object.entries(params.properties)) {
    if (typeof rule.yaml !== "string") continue
    if (!Object.prototype.hasOwnProperty.call(yaml, rule.yaml)) continue
    const registration = registry.properties.get(registrationKey(params.itemType, propertyKey))
    if (registration === undefined) {
      const typeRegistration = rule.type === undefined ? undefined : registry.propertyTypes.get(rule.type)
      const rawValue = yaml[rule.yaml]
      if (
        typeRegistration === undefined ||
        yamlScalarTagAt(yaml, rule.yaml) !== "xml" ||
        typeof rawValue !== "string"
      ) {
        continue
      }
      const payload = xmlScalarTagPayload(rawValue)
      actions.set(
        propertyKey,
        payload.length === 0
          ? { kind: "materializeCollection" }
          : { kind: "invalid", message: `${rule.yaml} допускает только пустой !xml` }
      )
      continue
    }
    if (registration.action === "transportScalar") {
      const rawValue = yaml[rule.yaml]
      if (yamlScalarTagAt(yaml, rule.yaml) === "xml" && typeof rawValue === "string") {
        const payload = xmlScalarTagPayload(rawValue)
        const override = registration.overrides?.[payload]
        actions.set(propertyKey, override === undefined
          ? { kind: "useYamlValue", yamlValue: payload }
          : { kind: "emit", xmlValue: override })
      }
      continue
    }
    if (!Object.is(yaml[rule.yaml], registration.yamlValue)) continue
    actions.set(
      propertyKey,
      registration.action === "omit"
        ? { kind: "omit" }
        : { kind: "emit", xmlValue: registration.xmlValue }
    )
  }
  return actions
}

export function hasExplicitXMLPropertyRegistration(itemType: string, propertyKey: string): boolean {
  return currentPropertyRuleRegistrySet<ContextualExplicitXMLPropertyRegistry>()
    ?.hasExplicitXMLProperty(itemType, propertyKey)
    ?? false
}

export function explicitXMLPropertyValidationMode(
  itemType: string,
  propertyKey: string,
  propertyType?: string,
  registry?: ExplicitXMLPropertyRegistryView,
): "empty" | "scalar" | undefined {
  const contextual = currentPropertyRuleRegistrySet<ContextualExplicitXMLPropertyRegistry>()
  if (registry === undefined) {
    if (contextual === undefined) throw new Error("Не задан execution context property rules")
    return contextual.explicitXMLPropertyValidationMode(itemType, propertyKey, propertyType)
  }
  const registration = registry.properties.get(registrationKey(itemType, propertyKey))
  if (registration !== undefined) return registration.action === "transportScalar" ? "scalar" : "empty"
  return propertyType !== undefined && registry.propertyTypes.has(propertyType) ? "empty" : undefined
}

export function registrationKey(itemType: string, propertyKey: string): string {
  return `${itemType}\0${propertyKey}`
}
