import type { RegisteredProjectSpec } from "../projectDefinition/projectSpecContracts"
import { currentRuleRegistrySet } from "../ruleRuntime/ruleRegistryExecutionContext"

export type ValidationProjectSpec = RegisteredProjectSpec

export function getValidationProjectSpecByDir(dir: string): ValidationProjectSpec | undefined {
  return currentRuleRegistrySet<{
    projectSpecs: ReadonlyMap<string, ValidationProjectSpec>
  }>()?.projectSpecs.get(dir)
}

export function getValidationProjectSpecs(): readonly ValidationProjectSpec[] {
  const contextual = currentRuleRegistrySet<{
    projectSpecs: ReadonlyMap<string, ValidationProjectSpec>
  }>()
  return [...(contextual?.projectSpecs.values() ?? [])].filter(({ dir }) => dir !== "")
}

export function getConfigurationValidationProjectSpec(): ValidationProjectSpec | undefined {
  return currentRuleRegistrySet<{
    projectSpecs: ReadonlyMap<string, ValidationProjectSpec>
  }>()?.projectSpecs.get("")
}
