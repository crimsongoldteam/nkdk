import type { ParsedYaml } from "../../../yaml/parseMetadataYaml"
import type { PendingMetadataTargetReferenceCandidate } from "./fn"
import type { MetadataItemRule } from "./types"
import type { Diagnostic } from "../../validation/types"
import type { YamlPath } from "../../validation/yamlLocations"
import type { ConfigurationContext } from "../../context/types"
import type { MetadataTargetConstraint, MetadataTargetOwner, ParsedMetadataTarget } from "../../commonObjects/metadataTargets/types"

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

export interface DependentStructuralItemReference {
  readonly yamlPath: YamlPath
  readonly canonical: string
  readonly target: ParsedMetadataTarget
  readonly constraint: MetadataTargetConstraint
  setCanonical(nextCanonical: string): void
  commitValue(): void
}

export interface DependentStructuralItemParams extends DependentYamlItemParams {
  readonly context: ConfigurationContext
  readonly metadataTargetOwner?: MetadataTargetOwner
}

export type DependentStructuralItemHandler = (
  params: DependentStructuralItemParams
) => readonly DependentStructuralItemReference[]
export interface DependentItemRegistrySnapshot {
  readonly yaml: Map<string, DependentYamlItemHandler>
  readonly structural: Map<string, DependentStructuralItemHandler>
}

const handlers = new Map<string, DependentYamlItemHandler>()
const structuralHandlers = new Map<string, DependentStructuralItemHandler>()

export function registerDependentYamlItemHandler(itemType: string, handler: DependentYamlItemHandler): void {
  handlers.set(itemType, handler)
}

export function analyzeDependentYamlItem(params: DependentYamlItemParams): DependentYamlItemAnalysis {
  return handlers.get(params.itemType)?.(params) ?? { diagnostics: [], references: [] }
}

export function registerDependentStructuralItemHandler(itemType: string, handler: DependentStructuralItemHandler): void {
  structuralHandlers.set(itemType, handler)
}

export function collectDependentStructuralItemReferences(
  params: DependentStructuralItemParams
): readonly DependentStructuralItemReference[] {
  return structuralHandlers.get(params.itemType)?.(params) ?? []
}

export function snapshotDependentItemRegistryForTests(): DependentItemRegistrySnapshot {
  return { yaml: new Map(handlers), structural: new Map(structuralHandlers) }
}

export function restoreDependentItemRegistryForTests(snapshot: DependentItemRegistrySnapshot): void {
  handlers.clear()
  structuralHandlers.clear()
  for (const [itemType, handler] of snapshot.yaml) handlers.set(itemType, handler)
  for (const [itemType, handler] of snapshot.structural) structuralHandlers.set(itemType, handler)
}
