import { createPropertyStateCapabilityRegistry as createRegistry } from "../../ruleRuntime/definition"
import type {
  PropertyStateCapabilityContribution,
} from "../../ruleRuntime/definition"
export {
  allPropertyStateModes,
  controlled,
  definePropertyStateItemCapabilities,
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

export function createPropertyStateCapabilityRegistry(
  contributions: readonly PropertyStateCapabilityContribution[],
) {
  return createRegistry(contributions, {
    normalize: normalizeCompatibilityMode,
    compare: compareCompatibilityModes,
  })
}

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
