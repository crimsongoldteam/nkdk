export interface ExplicitXMLPropertyRegistration {
  readonly itemType: string
  readonly propertyKey: string
  readonly xmlValue: unknown
  readonly yamlValue: unknown
}

const registrations = new Map<string, ExplicitXMLPropertyRegistration>()

export function registerExplicitXMLProperty(registration: ExplicitXMLPropertyRegistration): void {
  const key = registrationKey(registration.itemType, registration.propertyKey)
  const current = registrations.get(key)
  if (current === undefined) {
    registrations.set(key, registration)
    return
  }
  if (Object.is(current.xmlValue, registration.xmlValue) && Object.is(current.yamlValue, registration.yamlValue)) {
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
  if (!params.presentInXML) return undefined
  const registration = registrations.get(registrationKey(params.itemType, params.propertyKey))
  return registration !== undefined && Object.is(registration.xmlValue, params.xmlValue) ? registration : undefined
}

export function assertAllowedExplicitXMLTags(params: {
  readonly yaml: unknown
  readonly rule: MetadataItemRule
}): void {
  if (typeof params.yaml !== "object" || params.yaml === null || Array.isArray(params.yaml)) return
  const yaml = params.yaml as Record<string, unknown>
  const propertyByYamlKey = new Map(
    Object.entries(params.rule.properties).flatMap(([propertyKey, rule]) =>
      typeof rule.yaml === "string" ? [[rule.yaml, propertyKey] as const] : []
    )
  )

  for (const [yamlKey, value] of Object.entries(yaml)) {
    if (yamlScalarTagAt(yaml, yamlKey) !== "xml") continue
    const propertyKey = propertyByYamlKey.get(yamlKey)
    const registration =
      propertyKey === undefined
        ? undefined
        : registrations.get(registrationKey(params.rule.itemType, propertyKey))
    if (registration === undefined) {
      throw new Error(`Для ${params.rule.itemType}.${yamlKey} тег !xml не зарегистрирован`)
    }
    if (!Object.is(registration.yamlValue, value)) {
      throw new Error(
        `Для ${params.rule.itemType}.${yamlKey} тег !xml не допускает значение ${String(value)}`
      )
    }
  }
}

function registrationKey(itemType: string, propertyKey: string): string {
  return `${itemType}\0${propertyKey}`
}
import { yamlScalarTagAt } from "../../../yaml/scalarTags"
import type { MetadataItemRule } from "./types"
