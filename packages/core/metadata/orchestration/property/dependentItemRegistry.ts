import type { ParsedYaml } from "../../../yaml/parseMetadataYaml"
import type { PendingMetadataTargetReferenceCandidate } from "./fn"
import type { MetadataItemRule } from "./types"
import type { Diagnostic } from "../../validation/types"
import type { YamlPath } from "../../validation/yamlLocations"
import type { ConfigurationContext } from "../../context/types"
import type { MetadataTargetConstraint, MetadataTargetOwner, ParsedMetadataTarget } from "../../commonObjects/metadataTargets/types"
import type { ImportedDependentPropertyCandidate } from "./importYamlTypes"

export interface DependentItemParams {
  readonly itemType: string
  readonly itemName?: string
  readonly item: Record<string, unknown>
  readonly itemYamlPath: YamlPath
  readonly rootYaml: unknown
  readonly rootRule: MetadataItemRule
  readonly owner: { readonly dir: string; readonly name: string }
}

export interface DependentYamlItemAnalysis {
  readonly diagnostics: readonly Diagnostic[]
  readonly references: readonly PendingMetadataTargetReferenceCandidate[]
}

export interface DependentYamlItemParams extends DependentItemParams {
  readonly filePath: string
  readonly parsed: ParsedYaml
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

export interface DependentImportItemHandler {
  readonly propertyKeys: readonly string[]
  shouldRemove(params: DependentItemParams & { readonly candidate: ImportedDependentPropertyCandidate }): boolean
}
export interface DependentItemRegistrySnapshot {
  readonly yaml: Map<string, DependentYamlItemHandler>
  readonly structural: Map<string, DependentStructuralItemHandler>
  readonly imported: Map<string, DependentImportItemHandler>
}

const handlers = new Map<string, DependentYamlItemHandler>()
const structuralHandlers = new Map<string, DependentStructuralItemHandler>()
const importHandlers = new Map<string, DependentImportItemHandler>()

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

export function registerDependentImportItemHandler(itemType: string, handler: DependentImportItemHandler): void {
  importHandlers.set(itemType, handler)
}

export function isDependentImportProperty(itemType: string, propertyKey: string): boolean {
  return importHandlers.get(itemType)?.propertyKeys.includes(propertyKey) === true
}

export function shouldRemoveImportedDependentProperty(
  params: DependentItemParams & { readonly candidate: ImportedDependentPropertyCandidate }
): boolean {
  return importHandlers.get(params.itemType)?.shouldRemove(params) === true
}

export function snapshotDependentItemRegistryForTests(): DependentItemRegistrySnapshot {
  return { yaml: new Map(handlers), structural: new Map(structuralHandlers), imported: new Map(importHandlers) }
}

export function restoreDependentItemRegistryForTests(snapshot: DependentItemRegistrySnapshot): void {
  handlers.clear()
  structuralHandlers.clear()
  importHandlers.clear()
  for (const [itemType, handler] of snapshot.yaml) handlers.set(itemType, handler)
  for (const [itemType, handler] of snapshot.structural) structuralHandlers.set(itemType, handler)
  for (const [itemType, handler] of snapshot.imported) importHandlers.set(itemType, handler)
}
