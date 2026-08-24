import type {
  XmlAnomalyBoundary,
  XmlAnomalyLocation,
  XmlAnomalyRegistration,
} from "./contracts"

export interface XmlAnomalyRegistry {
  resolve(location: XmlAnomalyLocation): XmlAnomalyRegistration | undefined
}

export function createXmlAnomalyRegistry(
  registrations: readonly XmlAnomalyRegistration[],
): XmlAnomalyRegistry {
  const byPropertyType = new Map<string, XmlAnomalyRegistration>()
  const byProperty = new Map<string, XmlAnomalyRegistration>()

  for (const registration of registrations) {
    validateBoundary(registration.boundary)
    const target = "propertyType" in registration.boundary ? byPropertyType : byProperty
    const key = boundaryKey(registration.boundary)
    if (target.has(key)) {
      throw new Error(`Конфликт регистраций XML-аномалии ${formatBoundary(registration.boundary)}`)
    }
    target.set(key, registration)
  }

  return {
    resolve(location) {
      const exact = byProperty.get(propertyKey(location.itemType, location.propertyKey))
      const byType = byPropertyType.get(location.propertyType)
      if (exact !== undefined && byType !== undefined) {
        throw new Error(`Неоднозначные регистрации XML-аномалии ${location.itemType}.${location.propertyKey}`)
      }
      return exact ?? byType
    },
  }
}

function validateBoundary(boundary: XmlAnomalyBoundary): void {
  if ("propertyType" in boundary) {
    if (boundary.propertyType.length === 0) {
      throw new Error("Тип свойства регистрации XML-аномалии не задан")
    }
    return
  }
  if (boundary.itemType.length === 0 || boundary.propertyKey.length === 0) {
    throw new Error("Граница itemType/propertyKey регистрации XML-аномалии не задана")
  }
}

function boundaryKey(boundary: XmlAnomalyBoundary): string {
  return "propertyType" in boundary
    ? boundary.propertyType
    : propertyKey(boundary.itemType, boundary.propertyKey)
}

function propertyKey(itemType: string, propertyName: string): string {
  return `${itemType}\0${propertyName}`
}

function formatBoundary(boundary: XmlAnomalyBoundary): string {
  return "propertyType" in boundary
    ? `типа ${boundary.propertyType}`
    : `${boundary.itemType}.${boundary.propertyKey}`
}
