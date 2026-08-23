import type {
  XmlAnomalyBoundary,
  XmlAnomalyLocation,
  XmlAnomalyRegistration,
  XmlCompactRawRegistration,
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
    if (registration.kind === "compactRaw") validateCompactRawInputs(registration)

    const target = "propertyType" in registration.boundary
      ? byPropertyType
      : byProperty
    const key = boundaryKey(registration.boundary)
    if (target.has(key)) {
      throw new Error(
        `Конфликт регистраций XML-аномалии ${formatBoundary(registration.boundary)}`,
      )
    }
    target.set(key, registration)
  }

  return {
    resolve(location) {
      const exact = byProperty.get(propertyKey(location.itemType, location.propertyKey))
      const byType = byPropertyType.get(location.propertyType)
      if (exact !== undefined && byType !== undefined) {
        throw new Error(
          `Неоднозначные регистрации XML-аномалии ${location.itemType}.${location.propertyKey}`,
        )
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

function validateCompactRawInputs(
  registration: XmlCompactRawRegistration,
): void {
  const names = new Set<string>()
  for (const input of registration.inputs) {
    if (typeof input.name !== "string" || input.name.length === 0) {
      throw new Error("Имя входа compact raw не задано")
    }
    if (names.has(input.name)) {
      throw new Error(`Вход compact raw ${input.name} объявлен повторно`)
    }
    names.add(input.name)
  }
  for (const input of registration.inputs) validateInputSource(input, names)
  validateIndexDependencyCycles(registration)
}

function validateInputSource(
  input: XmlCompactRawRegistration["inputs"][number],
  names: ReadonlySet<string>,
): void {
  const source: unknown = input.source
  if (typeof source !== "object" || source === null || !("kind" in source)) {
    throw new Error(`Source входа compact raw ${input.name} не задан`)
  }
  const declaration = source as Record<string, unknown>
  switch (declaration.kind) {
    case "yamlProperty":
      validatePath(declaration.propertyPath, `YAML property path входа ${input.name}`)
      return
    case "owner":
      if (declaration.projection !== "itemType") {
        throw new Error(`Owner projection входа compact raw ${input.name} не поддерживается`)
      }
      return
    case "propertyRule":
      validatePath(declaration.fieldPath, `PropertyRule field path входа ${input.name}`)
      return
    case "standardIndex":
      if (typeof declaration.index !== "string" || declaration.index.length === 0) {
        throw new Error(`Standard index name входа compact raw ${input.name} не задан`)
      }
      if (
        !Array.isArray(declaration.keyInputs) ||
        declaration.keyInputs.some((dependency) => typeof dependency !== "string" || dependency.length === 0)
      ) {
        throw new Error(`Standard index dependencies входа compact raw ${input.name} не заданы`)
      }
      const dependencies = new Set<string>()
      for (const dependency of declaration.keyInputs as readonly string[]) {
        if (dependencies.has(dependency)) {
          throw new Error(
            `Standard index dependency ${dependency} входа compact raw ${input.name} объявлена повторно`,
          )
        }
        dependencies.add(dependency)
        if (!names.has(dependency)) {
          throw new Error(
            `Standard index dependency ${dependency} входа compact raw ${input.name} не объявлена`,
          )
        }
      }
      return
    default:
      throw new Error(`Source kind входа compact raw ${input.name} не поддерживается`)
  }
}

function validatePath(value: unknown, description: string): void {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((segment) => typeof segment !== "string" || segment.length === 0)
  ) {
    throw new Error(`${description} не задан`)
  }
}

function validateIndexDependencyCycles(
  registration: XmlCompactRawRegistration,
): void {
  const byName = new Map(registration.inputs.map((input) => [input.name, input]))
  const complete = new Set<string>()
  const active = new Set<string>()
  const visit = (name: string): void => {
    if (complete.has(name)) return
    if (active.has(name)) {
      throw new Error(`Цикл standard index dependencies compact raw: ${name}`)
    }
    active.add(name)
    const input = byName.get(name)
    if (input?.source.kind === "standardIndex") {
      for (const dependency of input.source.keyInputs) visit(dependency)
    }
    active.delete(name)
    complete.add(name)
  }
  for (const input of registration.inputs) visit(input.name)
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
