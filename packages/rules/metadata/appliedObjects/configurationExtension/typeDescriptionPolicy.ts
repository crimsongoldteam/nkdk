import {
  CompatibilityMode,
  CompatibilityModeFromYAML,
  CompatibilityModeToYAML,
  CompatibilityModeYAML,
} from "../../systemEnumerations/types"

const COMPATIBILITY_MODE_PROPERTY = "РежимСовместимостиРасширенияКонфигурации"
const DEFAULT_MODE: CompatibilityMode = "Version8_3_27"
const ANY_REF_LAST_MODE = [8, 3, 22] as const

export function configurationExtensionTypeDescriptionXMLNameByType(
  rootYaml: unknown
): Readonly<Record<string, string>> {
  const yamlMode = readProperty(rootYaml, COMPATIBILITY_MODE_PROPERTY)
  const mode = yamlMode === undefined ? DEFAULT_MODE : getCompatibilityMode(yamlMode)

  if (mode === undefined) {
    throw new Error(`Неизвестный ${COMPATIBILITY_MODE_PROPERTY}: ${String(yamlMode)}`)
  }

  return { AnyIBRef: usesLegacyAnyRef(mode) ? "AnyRef" : "AnyIBRef" }
}

export function configurationExtensionTypeDescriptionXMLNameByCompatibilityMode(
  xmlMode: unknown,
): Readonly<Record<string, string>> {
  if (xmlMode === undefined) return configurationExtensionTypeDescriptionXMLNameByType({})
  if (typeof xmlMode !== "string" || !Object.hasOwn(CompatibilityModeToYAML, xmlMode)) {
    throw new Error(`Неизвестный ${COMPATIBILITY_MODE_PROPERTY}: ${String(xmlMode)}`)
  }
  return configurationExtensionTypeDescriptionXMLNameByType({
    [COMPATIBILITY_MODE_PROPERTY]: CompatibilityModeToYAML[xmlMode as CompatibilityMode],
  })
}

const readProperty = (value: unknown, property: string): unknown =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)[property]
    : undefined

const getCompatibilityMode = (value: unknown): CompatibilityMode | undefined => {
  if (typeof value !== "string" || !Object.hasOwn(CompatibilityModeFromYAML, value)) return undefined
  return CompatibilityModeFromYAML[value as CompatibilityModeYAML]
}

const usesLegacyAnyRef = (mode: CompatibilityMode): boolean => {
  if (mode === "DontUse") return false

  const version = mode
    .slice("Version".length)
    .split("_")
    .map((part) => Number(part))

  for (let index = 0; index < Math.max(version.length, ANY_REF_LAST_MODE.length); index++) {
    const difference = (version[index] ?? 0) - (ANY_REF_LAST_MODE[index] ?? 0)
    if (difference !== 0) return difference < 0
  }
  return true
}
