import { createPropertyStateCapabilityRegistry as createRegistry } from "../../ruleRuntime/definition"
import type {
  PropertyStateCapabilityContribution,
  PropertyStatePropertyCapability,
} from "../../ruleRuntime/definition"
import type { MetadataItemRule } from "../../ruleRuntime/property/types"
import {
  CompatibilityModeFromYAML,
  CompatibilityModeToYAML,
} from "../../systemEnumerations/types"

const DEFAULT_COMPATIBILITY_MODE = "Версия8_3_27"
const DONT_USE_MODES = new Set(["НеИспользовать", "DontUse"])
const VERSION_PATTERN = /^(?:Версия|Version)(\d+)_(\d+)_(\d+)$/u

export function createPropertyStateCapabilityRegistry(
  contributions: readonly PropertyStateCapabilityContribution[],
) {
  return createRegistry(contributions, {
    normalize: normalizeCompatibilityMode,
    compare: compareCompatibilityModes,
  })
}

export function definePropertyStateProfile(
  id: string,
  properties: Readonly<Record<string, PropertyStatePropertyCapability>>,
): PropertyStateCapabilityContribution {
  return { kind: "propertyStateCapability", id, profile: { properties } }
}

export function definePropertyStateItemCapabilities<
  const Rule extends MetadataItemRule,
  const Properties extends Partial<Record<keyof Rule["properties"] & string, PropertyStatePropertyCapability>>,
>(
  rule: Rule,
  options: {
    readonly itemType?: string
    readonly profiles?: readonly string[]
    readonly properties?: Properties
  },
): PropertyStateCapabilityContribution {
  return {
    kind: "propertyStateCapability",
    id: `item:${options.itemType ?? rule.itemType}`,
    item: {
      itemType: options.itemType ?? rule.itemType,
      profiles: options.profiles ?? [],
      properties: options.properties as Readonly<Record<string, PropertyStatePropertyCapability>> | undefined,
    },
  }
}

const borrowed = (modes: PropertyStatePropertyCapability["modes"], representation?: PropertyStatePropertyCapability["representation"]): PropertyStatePropertyCapability => ({
  availability: "borrowed",
  modes,
  ...(representation === undefined ? {} : { representation }),
})

export const controlled = (...keys: readonly string[]): Readonly<Record<string, PropertyStatePropertyCapability>> =>
  Object.fromEntries(keys.map((key) => [key, borrowed(["control", "notify"], "tagged")]))

export const extended = (...keys: readonly string[]): Readonly<Record<string, PropertyStatePropertyCapability>> =>
  Object.fromEntries(keys.map((key) => [key, borrowed(["extend"], "plain")]))

export const allPropertyStateModes = (...keys: readonly string[]): Readonly<Record<string, PropertyStatePropertyCapability>> =>
  Object.fromEntries(keys.map((key) => [key, borrowed(["control", "notify", "extend"], "tagged")]))

export const multiState = (...keys: readonly string[]): Readonly<Record<string, PropertyStatePropertyCapability>> =>
  Object.fromEntries(keys.map((key) => [key, borrowed(["control", "notify", "extend", "multi"], "multi")]))

function normalizeCompatibilityMode(mode: string | undefined): string {
  if (mode === undefined || DONT_USE_MODES.has(mode)) return DEFAULT_COMPATIBILITY_MODE
  if (Object.hasOwn(CompatibilityModeFromYAML, mode)) return mode
  if (Object.hasOwn(CompatibilityModeToYAML, mode)) {
    return CompatibilityModeToYAML[mode as keyof typeof CompatibilityModeToYAML]
  }
  throw new Error(`Неизвестный РежимСовместимостиРасширенияКонфигурации: ${mode}`)
}

function compareCompatibilityModes(first: string, second: string): number {
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
