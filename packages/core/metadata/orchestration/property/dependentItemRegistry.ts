import type { ParsedYaml } from "../../../yaml/parseMetadataYaml"
import type { PendingMetadataTargetReferenceCandidate } from "./fn"
import type { MetadataItemRule } from "./types"
import type { Diagnostic } from "../../validation/types"
import type { YamlPath } from "../../validation/yamlLocations"

export interface DependentYamlItemAnalysis {
  readonly diagnostics: readonly Diagnostic[]
  readonly references: readonly PendingMetadataTargetReferenceCandidate[]
}

export interface DependentYamlItemParams {
  readonly itemType: string
  readonly itemName?: string
  readonly item: Record<string, unknown>
  readonly itemYamlPath: YamlPath
  readonly rootYaml: unknown
  readonly rootRule: MetadataItemRule
  readonly filePath: string
  readonly parsed: ParsedYaml
  readonly owner: { readonly dir: string; readonly name: string }
}

export type DependentYamlItemHandler = (params: DependentYamlItemParams) => DependentYamlItemAnalysis
export type DependentItemRegistrySnapshot = Map<string, DependentYamlItemHandler>

const handlers = new Map<string, DependentYamlItemHandler>()

export function registerDependentYamlItemHandler(itemType: string, handler: DependentYamlItemHandler): void {
  handlers.set(itemType, handler)
}

export function analyzeDependentYamlItem(params: DependentYamlItemParams): DependentYamlItemAnalysis {
  return handlers.get(params.itemType)?.(params) ?? { diagnostics: [], references: [] }
}

export function snapshotDependentItemRegistryForTests(): DependentItemRegistrySnapshot {
  return new Map(handlers)
}

export function restoreDependentItemRegistryForTests(snapshot: DependentItemRegistrySnapshot): void {
  handlers.clear()
  for (const [itemType, handler] of snapshot) handlers.set(itemType, handler)
}
