import type { ComponentAddress } from "./address"
import type { MetadataItemRule } from "../ruleRuntime/property/types"
import { currentRuleRegistrySet } from "../ruleRuntime/ruleRegistryExecutionContext"

export interface MetadataComponentDescriptor {
  readonly kind: ComponentAddress["kind"]
  readonly rootRule: MetadataItemRule
}

export function getMetadataComponentDescriptor(kind: string): MetadataComponentDescriptor {
  const descriptor = findMetadataComponentDescriptor(kind)
  if (descriptor === undefined) {
    throw new Error(`Не найдено описание metadata-компонента: ${kind}`)
  }
  return descriptor
}

export function findMetadataComponentDescriptor(kind: string): MetadataComponentDescriptor | undefined {
  return currentRuleRegistrySet<{ components: ReadonlyMap<string, MetadataComponentDescriptor> }>()
    ?.components.get(kind)
}
