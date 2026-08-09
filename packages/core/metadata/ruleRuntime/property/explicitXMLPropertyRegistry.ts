import { yamlScalarTagAt } from "../../../yaml/scalarTags"

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
      readonly yamlValue: ""
    }

export type ExplicitXMLPropertyAction = "emit" | "omit"

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

export function assertAllowedExplicitXMLTags(params: {
  readonly yaml: unknown
  readonly itemType: string
  readonly properties: Readonly<Record<string, { readonly yaml?: string }>>
}): ReadonlyMap<string, ExplicitXMLPropertyAction> {
  const actions = new Map<string, ExplicitXMLPropertyAction>()
  if (typeof params.yaml !== "object" || params.yaml === null || Array.isArray(params.yaml)) return actions
  const yaml = params.yaml as Record<string, unknown>
  const propertyByYamlKey = new Map(
    Object.entries(params.properties).flatMap(([propertyKey, rule]) =>
      typeof rule.yaml === "string" ? [[rule.yaml, propertyKey] as const] : []
    )
  )

  for (const [yamlKey, value] of Object.entries(yaml)) {
    if (yamlScalarTagAt(yaml, yamlKey) !== "xml") continue
    const propertyKey = propertyByYamlKey.get(yamlKey)
    const registration =
      propertyKey === undefined
        ? undefined
        : registrations.get(registrationKey(params.itemType, propertyKey))
    if (registration === undefined) {
      throw new Error(`Для ${params.itemType}.${yamlKey} тег !xml не зарегистрирован`)
    }
    if (!Object.is(registration.yamlValue, value)) {
      throw new Error(
        `Для ${params.itemType}.${yamlKey} тег !xml не допускает значение ${String(value)}`
      )
    }
    actions.set(propertyKey!, registration.action ?? "emit")
  }
  return actions
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
