import { EMPTY_XML_TAG_VALUE } from "../../../yaml/scalarTags"

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

export type ExplicitXMLPropertyAction =
  | { readonly kind: "emit"; readonly xmlValue: unknown }
  | { readonly kind: "omit" }

const registrations = new Map<string, ExplicitXMLPropertyRegistration>()

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

export function matchExplicitXMLPropertyFromXML(params: {
  readonly itemType: string
  readonly propertyKey: string
  readonly presentInXML: boolean
  readonly xmlValue: unknown
}): ExplicitXMLPropertyRegistration | undefined {
  const registration = registrations.get(registrationKey(params.itemType, params.propertyKey))
  if (registration?.action === "omit") return params.presentInXML ? undefined : registration
  return registration !== undefined && params.presentInXML && Object.is(registration.xmlValue, params.xmlValue)
    ? registration
    : undefined
}

export function collectExplicitXMLPropertyActions(params: {
  readonly yaml: unknown
  readonly itemType: string
  readonly properties: Readonly<Record<string, { readonly yaml?: string }>>
}): ReadonlyMap<string, ExplicitXMLPropertyAction> {
  const actions = new Map<string, ExplicitXMLPropertyAction>()
  if (typeof params.yaml !== "object" || params.yaml === null || Array.isArray(params.yaml)) return actions
  const yaml = params.yaml as Record<string, unknown>
  for (const [propertyKey, rule] of Object.entries(params.properties)) {
    if (typeof rule.yaml !== "string") continue
    if (!Object.prototype.hasOwnProperty.call(yaml, rule.yaml)) continue
    const registration = registrations.get(registrationKey(params.itemType, propertyKey))
    if (registration === undefined) continue
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

function sameRegistration(
  left: ExplicitXMLPropertyRegistration,
  right: ExplicitXMLPropertyRegistration
): boolean {
  const leftAction = left.action ?? "emit"
  const rightAction = right.action ?? "emit"
  if (leftAction !== rightAction || !Object.is(left.yamlValue, right.yamlValue)) return false
  return leftAction === "omit" ||
    ("xmlValue" in left && "xmlValue" in right && Object.is(left.xmlValue, right.xmlValue))
}

function registrationKey(itemType: string, propertyKey: string): string {
  return `${itemType}\0${propertyKey}`
}
