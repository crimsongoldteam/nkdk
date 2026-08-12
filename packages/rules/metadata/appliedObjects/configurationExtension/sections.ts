import type {
  PropertyStateMode,
  ResolvedPropertyStateItemCapability,
} from "../../ruleRuntime/definition"

export type PropertyStateSectionMode = "notify" | "extend"

const SECTION_BY_MODE = {
  notify: "Проверять",
  extend: "Изменять",
} as const

export function readPropertyStateSections(
  yaml: Readonly<Record<string, unknown>>,
  capability: ResolvedPropertyStateItemCapability,
): ReadonlyMap<string, PropertyStateSectionMode> {
  const result = new Map<string, PropertyStateSectionMode>()
  for (const mode of ["notify", "extend"] as const) {
    const section = SECTION_BY_MODE[mode]
    const names = readSection(yaml, section)
    const seen = new Set<string>()
    for (const externalName of names) {
      if (seen.has(externalName)) throw new Error(`${section}: имя ${externalName} повторяется`)
      seen.add(externalName)
      const entry = propertyByExternalName(capability, externalName)
      if (entry === undefined) throw new Error(`${section}: неизвестное или недопустимое имя ${externalName}`)
      const [propertyKey, property] = entry
      if (!property.modes.includes(mode as PropertyStateMode)) {
        throw new Error(`${externalName} не разрешает режим ${section}`)
      }
      const previous = result.get(propertyKey)
      if (previous !== undefined) {
        throw new Error(`${externalName} нельзя одновременно указать в Проверять и Изменять`)
      }
      result.set(propertyKey, mode)
    }
  }
  return result
}

export function writePropertyStateSection(
  yaml: Record<string, unknown>,
  capability: ResolvedPropertyStateItemCapability,
  externalName: string,
  mode: PropertyStateSectionMode,
): void {
  const entry = propertyByExternalName(capability, externalName)
  if (entry === undefined || !entry[1].modes.includes(mode)) {
    throw new Error(`${externalName} не разрешает режим ${SECTION_BY_MODE[mode]}`)
  }
  const current = readPropertyStateSections(yaml, capability)
  const propertyKey = entry[0]
  const previous = current.get(propertyKey)
  if (previous !== undefined && previous !== mode) {
    throw new Error(`${externalName} нельзя одновременно указать в Проверять и Изменять`)
  }
  const next = new Map(current)
  next.set(propertyKey, mode)
  rewriteSections(yaml, capability, next)
}

function rewriteSections(
  yaml: Record<string, unknown>,
  capability: ResolvedPropertyStateItemCapability,
  states: ReadonlyMap<string, PropertyStateSectionMode>,
): void {
  delete yaml.Проверять
  delete yaml.Изменять
  for (const mode of ["notify", "extend"] as const) {
    const names = Object.entries(capability.properties)
      .filter(([propertyKey]) => states.get(propertyKey) === mode)
      .flatMap(([, property]) => property.externalName === undefined ? [] : [property.externalName])
    if (names.length > 0) yaml[SECTION_BY_MODE[mode]] = names
  }
}

function readSection(yaml: Readonly<Record<string, unknown>>, section: "Проверять" | "Изменять"): string[] {
  const value = yaml[section]
  if (value === undefined) return []
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${section} должен быть массивом строк`)
  }
  return value as string[]
}

function propertyByExternalName(
  capability: ResolvedPropertyStateItemCapability,
  externalName: string,
) {
  return Object.entries(capability.properties).find(([, property]) =>
    property.representation === "section" && property.externalName === externalName)
}
