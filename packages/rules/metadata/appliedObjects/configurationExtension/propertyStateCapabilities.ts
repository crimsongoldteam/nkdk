import { createPropertyStateCapabilityRegistry as createRegistry } from "../../ruleRuntime/definition"
import type {
  PropertyStateCapabilityContribution,
  PropertyStatePropertyCapability,
} from "../../ruleRuntime/definition"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
export {
  allPropertyStateModes,
  controlled,
  definePropertyStateProfile,
  extended,
  externalProperty,
  multiState,
} from "../../ruleRuntime/definition/propertyStateDeclarations"
import {
  CompatibilityModeFromYAML,
  CompatibilityModeToYAML,
} from "../../systemEnumerations/types"

const DEFAULT_COMPATIBILITY_MODE = "Версия8_3_27"
const DONT_USE_MODES = new Set(["НеИспользовать", "DontUse"])
const VERSION_PATTERN = /^(?:Версия|Version)(\d+)_(\d+)_(\d+)$/u

const MODULE_EXTERNAL_NAMES: Readonly<Record<string, string>> = {
  objectModule: "МодульОбъекта",
  managerModule: "МодульМенеджера",
  recordSetModule: "МодульНабораЗаписей",
  module: "Модуль",
  valueManagerModule: "МодульМенеджераЗначения",
  commandModule: "МодульКоманды",
}

export function definePropertyStateItemCapabilities<const Rule extends MetadataItemRule>(
  rule: Rule,
  options: {
    readonly itemType?: string
    readonly profiles?: readonly string[]
    readonly properties?: Partial<Record<keyof Rule["properties"] & string, PropertyStatePropertyCapability>>
  },
): PropertyStateCapabilityContribution {
  const modules: Record<string, PropertyStatePropertyCapability> = {}
  for (const propertyKey of Object.keys(rule.properties)) {
    const externalName = MODULE_EXTERNAL_NAMES[propertyKey]
    if (externalName === undefined) continue
    modules[propertyKey] = {
      availability: "borrowed",
      modes: ["extend"],
      representation: "section",
      externalName,
    }
  }
  for (const [propertyKey, property] of Object.entries(options.properties ?? {})) {
    if (property !== undefined) modules[propertyKey] = property
  }
  return {
    kind: "propertyStateCapability",
    id: `item:${options.itemType ?? rule.itemType}`,
    item: {
      itemType: options.itemType ?? rule.itemType,
      profiles: options.profiles ?? [],
      properties: modules,
    },
  }
}

export function createPropertyStateCapabilityRegistry(
  contributions: readonly PropertyStateCapabilityContribution[],
) {
  return createRegistry(contributions, {
    normalize: normalizeCompatibilityMode,
    compare: compareCompatibilityModes,
  })
}

export function normalizeCompatibilityMode(mode: string | undefined): string {
  if (mode === undefined || DONT_USE_MODES.has(mode)) return DEFAULT_COMPATIBILITY_MODE
  if (Object.hasOwn(CompatibilityModeFromYAML, mode)) return mode
  if (Object.hasOwn(CompatibilityModeToYAML, mode)) {
    return CompatibilityModeToYAML[mode as keyof typeof CompatibilityModeToYAML]
  }
  throw new Error(`Неизвестный РежимСовместимостиРасширенияКонфигурации: ${mode}`)
}

export function compareCompatibilityModes(first: string, second: string): number {
  const firstVersion = parseCompatibilityMode(normalizeCompatibilityMode(first))
  const secondVersion = parseCompatibilityMode(normalizeCompatibilityMode(second))
  for (let index = 0; index < firstVersion.length; index += 1) {
    const difference = firstVersion[index]! - secondVersion[index]!
    if (difference !== 0) return difference
  }
  return 0
}

function parseCompatibilityMode(mode: string): readonly number[] {
  const match = VERSION_PATTERN.exec(mode)
  if (match === null) throw new Error(`Неизвестный РежимСовместимостиРасширенияКонфигурации: ${mode}`)
  return match.slice(1).map(Number)
}
