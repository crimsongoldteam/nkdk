import {
  EMPTY_XML_TAG_VALUE,
  xmlScalarTagPayload,
  yamlScalarTagAt,
} from "../../../yaml/scalarTags"

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

const registrations = new Map<string, ExplicitXMLPropertyRegistration>()
const typeRegistrations = new Map<string, ExplicitXMLPropertyTypeRegistration>()

export interface ExplicitXMLPropertyRegistryView {
  readonly properties: ReadonlyMap<string, ExplicitXMLPropertyRegistration>
  readonly propertyTypes: ReadonlyMap<string, ExplicitXMLPropertyTypeRegistration>
}

const globalRegistryView: ExplicitXMLPropertyRegistryView = {
  properties: registrations,
  propertyTypes: typeRegistrations,
}

export function registerExplicitXMLProperty(registration: ExplicitXMLPropertyRegistration): void {
  const key = registrationKey(registration.itemType, registration.propertyKey)
  const current = registrations.get(key)
  if (current === undefined) {
    registrations.set(key, registration)
    return
  }
  if (sameRegistration(current, registration)) {
    return
  }
  throw new Error(`Конфликт регистрации явного XML-значения ${registration.itemType}.${registration.propertyKey}`)
}

export function registerExplicitXMLPropertyType(registration: ExplicitXMLPropertyTypeRegistration): void {
  const current = typeRegistrations.get(registration.propertyType)
  if (current === undefined) {
    typeRegistrations.set(registration.propertyType, registration)
    return
  }
  if (
    current.action === registration.action &&
    Object.is(current.yamlValue, registration.yamlValue)
  ) {
    return
  }
  throw new Error(`Конфликт регистрации явного XML-значения типа ${registration.propertyType}`)
}

export function matchExplicitXMLPropertyFromXML(params: {
  readonly itemType: string
  readonly propertyKey: string
  readonly presentInXML: boolean
  readonly xmlValue: unknown
}): Exclude<ExplicitXMLPropertyRegistration, { readonly action: "transportScalar" }> | undefined {
  const registration = registrations.get(registrationKey(params.itemType, params.propertyKey))
  if (registration?.action === "transportScalar") return undefined
  if (registration?.action === "omit") return params.presentInXML ? undefined : registration
  return registration !== undefined && params.presentInXML && Object.is(registration.xmlValue, params.xmlValue)
    ? registration
    : undefined
}

export function matchExplicitXMLPropertyTypeFromXML(params: {
  readonly propertyType: string
  readonly presentInXML: boolean
  readonly yamlValue: unknown
}): ExplicitXMLPropertyTypeRegistration | undefined {
  const registration = typeRegistrations.get(params.propertyType)
  return registration !== undefined &&
    params.presentInXML &&
    Object.is(params.yamlValue, registration.yamlValue)
    ? registration
    : undefined
}

export function collectExplicitXMLPropertyActions(params: {
  readonly yaml: unknown
  readonly itemType: string
  readonly properties: Readonly<Record<string, { readonly type?: string; readonly yaml?: string }>>
}, registry: ExplicitXMLPropertyRegistryView = globalRegistryView): ReadonlyMap<string, ExplicitXMLPropertyAction> {
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
  return registrations.has(registrationKey(itemType, propertyKey))
}

export function explicitXMLPropertyValidationMode(
  itemType: string,
  propertyKey: string,
  propertyType?: string,
  registry: ExplicitXMLPropertyRegistryView = globalRegistryView,
): "empty" | "scalar" | undefined {
  const registration = registry.properties.get(registrationKey(itemType, propertyKey))
  if (registration !== undefined) return registration.action === "transportScalar" ? "scalar" : "empty"
  return propertyType !== undefined && registry.propertyTypes.has(propertyType) ? "empty" : undefined
}

function sameRegistration(
  left: ExplicitXMLPropertyRegistration,
  right: ExplicitXMLPropertyRegistration
): boolean {
  if (left.action === "transportScalar" || right.action === "transportScalar") {
    return left.action === "transportScalar" && right.action === "transportScalar" &&
      JSON.stringify(left.overrides) === JSON.stringify(right.overrides)
  }
  const leftAction = left.action ?? "emit"
  const rightAction = right.action ?? "emit"
  if (leftAction !== rightAction) return false
  if (!Object.is(left.yamlValue, right.yamlValue)) return false
  return leftAction === "omit" ||
    ("xmlValue" in left && "xmlValue" in right && Object.is(left.xmlValue, right.xmlValue))
}

export function registrationKey(itemType: string, propertyKey: string): string {
  return `${itemType}\0${propertyKey}`
}
