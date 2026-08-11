import type { MetadataItemRule } from "../property/types"
import type { MetadataImportedYamlFinalizer, MetadataImportedYamlFinalizerParams } from "../definition"
import { currentPropertyRuleRegistrySet } from "@nkdk/runtime/rule-kit"

export type MetadataItemImportedYamlFinalizerParams = MetadataImportedYamlFinalizerParams
export type MetadataItemImportedYamlFinalizer = MetadataImportedYamlFinalizer

export function registerMetadataItemImportedYamlFinalizer(
  itemType: string,
  finalizer: MetadataItemImportedYamlFinalizer
): void {
  const registry = requireRegistry()
  registry.registerImportedYamlFinalizer(itemType, finalizer)
}

export function requiresMetadataItemImportedYamlFinalization(params: {
  yaml: unknown
  rule: MetadataItemRule
}): boolean {
  return requireRegistry().requiresImportedYamlFinalization(params.yaml, params.rule)
}

export function supportsMetadataItemImportedYamlFinalization(rule: MetadataItemRule): boolean {
  return requireRegistry().supportsImportedYamlFinalization(rule.itemType)
}

export function finalizeMetadataItemImportedYaml(
  params: MetadataItemImportedYamlFinalizerParams
): void {
  requireRegistry().finalizeImportedYaml(params)
}

function requireRegistry() {
  const registry = currentPropertyRuleRegistrySet<{
    registerImportedYamlFinalizer(itemType: string, finalizer: MetadataImportedYamlFinalizer): void
    requiresImportedYamlFinalization(yaml: unknown, rule: MetadataItemRule): boolean
    supportsImportedYamlFinalization(itemType: string): boolean
    finalizeImportedYaml(params: MetadataImportedYamlFinalizerParams): void
  }>()
  if (registry === undefined) throw new Error("Не задан execution context imported YAML finalizers")
  return registry
}
