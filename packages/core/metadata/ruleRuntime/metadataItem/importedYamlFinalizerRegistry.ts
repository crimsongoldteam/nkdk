import type { OwnerMetadataCache } from "../../validation/dataPath/ownerCache"
import type { MetadataItemRule } from "../property/types"

export interface MetadataItemImportedYamlFinalizerParams {
  yaml: unknown
  rule: MetadataItemRule
  ownerMetadataCache: OwnerMetadataCache
  currentConfigurationYAML?: unknown
  savedBaseYAML?: unknown
}

export interface MetadataItemImportedYamlFinalizer {
  requiresFinalization(yaml: unknown, rule: MetadataItemRule): boolean
  finalize(params: MetadataItemImportedYamlFinalizerParams): void
}

const finalizers = new Map<string, MetadataItemImportedYamlFinalizer>()

export function registerMetadataItemImportedYamlFinalizer(
  itemType: string,
  finalizer: MetadataItemImportedYamlFinalizer
): void {
  if (finalizers.has(itemType)) {
    throw new Error(`Уточнение импортированного YAML уже зарегистрировано: ${itemType}`)
  }
  finalizers.set(itemType, finalizer)
}

export function requiresMetadataItemImportedYamlFinalization(params: {
  yaml: unknown
  rule: MetadataItemRule
}): boolean {
  return finalizers.get(params.rule.itemType)?.requiresFinalization(params.yaml, params.rule) ?? false
}

export function supportsMetadataItemImportedYamlFinalization(rule: MetadataItemRule): boolean {
  return finalizers.has(rule.itemType)
}

export function finalizeMetadataItemImportedYaml(
  params: MetadataItemImportedYamlFinalizerParams
): void {
  finalizers.get(params.rule.itemType)?.finalize(params)
}
