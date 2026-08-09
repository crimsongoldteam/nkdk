import type { TypeDescriptionView } from "./typeDescriptionView"
import type { FillValueTypedValue } from "./fillValueSemantics"

type DependentYamlPath = readonly (string | number)[]

interface DependentDiagnostic {
  readonly filePath: string
  readonly line: number
  readonly col: number
  readonly message: string
  readonly severity: "error" | "warning"
  readonly source: "syntax" | "structure" | "external-file" | "cross-file" | "reference"
  readonly path?: string
}

export interface DependentReferenceCandidate {
  readonly yamlPath: DependentYamlPath
  readonly canonical: string
  readonly target: unknown
  readonly constraint: unknown
}

export interface DependentImportedPropertyCandidate {
  readonly itemType: string
  readonly itemYamlPath: DependentYamlPath
  readonly itemName?: string
  readonly propertyKey: string
  readonly yamlPath: DependentYamlPath
  readonly logicalAddress?: string
  readonly xmlValue: unknown
  readonly presentInXML: boolean
}

export interface DependentItemParams {
  readonly itemType: string
  readonly itemName?: string
  readonly item: Record<string, unknown>
  readonly itemYamlPath: DependentYamlPath
  readonly rootYaml: unknown
  readonly rootRule: unknown
  readonly owner: { readonly dir: string; readonly name: string }
}

export interface DependentYamlItemAnalysis {
  readonly diagnostics: readonly DependentDiagnostic[]
  readonly references: readonly DependentReferenceCandidate[]
  readonly projectChecks: readonly DependentProjectCheckCandidate[]
}

export interface DependentProjectCheckCandidate {
  readonly kind: "fillValue"
  readonly yamlPath: DependentYamlPath
  readonly itemType: string
  readonly type: TypeDescriptionView
  readonly value: FillValueTypedValue
  readonly tagged: boolean
}

export interface DependentYamlItemParams extends DependentItemParams {
  readonly filePath: string
  readonly parsed: unknown
}

export type DependentYamlItemHandler = (params: DependentYamlItemParams) => DependentYamlItemAnalysis

export interface DependentStructuralItemReference extends DependentReferenceCandidate {
  setCanonical(nextCanonical: string): void
  commitValue(): void
}

export interface DependentStructuralItemParams extends DependentYamlItemParams {
  readonly context: unknown
  readonly metadataTargetOwner?: { readonly root: string; readonly objectName: string }
}

export type DependentStructuralItemHandler = (
  params: DependentStructuralItemParams
) => readonly DependentStructuralItemReference[]

export interface DependentImportItemHandler {
  readonly propertyKeys: readonly string[]
  shouldRemove(params: DependentItemParams & { readonly candidate: DependentImportedPropertyCandidate }): boolean
  shouldTagXML?(params: DependentItemParams & { readonly candidate: DependentImportedPropertyCandidate }): boolean
}

export interface DependentItemRegistrySnapshot {
  readonly yaml: Map<string, DependentYamlItemHandler>
  readonly structural: Map<string, DependentStructuralItemHandler>
  readonly imported: Map<string, DependentImportItemHandler>
}

const yamlHandlers = new Map<string, DependentYamlItemHandler>()
const structuralHandlers = new Map<string, DependentStructuralItemHandler>()
const importHandlers = new Map<string, DependentImportItemHandler>()

export function registerDependentYamlItemHandler(itemType: string, handler: DependentYamlItemHandler): void {
  yamlHandlers.set(itemType, handler)
}

export function analyzeDependentYamlItem(params: DependentYamlItemParams): DependentYamlItemAnalysis {
  return yamlHandlers.get(params.itemType)?.(params) ?? { diagnostics: [], references: [], projectChecks: [] }
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
  params: DependentItemParams & { readonly candidate: DependentImportedPropertyCandidate }
): boolean {
  return importHandlers.get(params.itemType)?.shouldRemove(params) === true
}

export function shouldTagImportedDependentProperty(
  params: DependentItemParams & { readonly candidate: DependentImportedPropertyCandidate }
): boolean {
  return importHandlers.get(params.itemType)?.shouldTagXML?.(params) === true
}

export function snapshotDependentItemRegistryForTests(): DependentItemRegistrySnapshot {
  return { yaml: new Map(yamlHandlers), structural: new Map(structuralHandlers), imported: new Map(importHandlers) }
}

export function restoreDependentItemRegistryForTests(snapshot: DependentItemRegistrySnapshot): void {
  yamlHandlers.clear()
  structuralHandlers.clear()
  importHandlers.clear()
  for (const [itemType, handler] of snapshot.yaml) yamlHandlers.set(itemType, handler)
  for (const [itemType, handler] of snapshot.structural) structuralHandlers.set(itemType, handler)
  for (const [itemType, handler] of snapshot.imported) importHandlers.set(itemType, handler)
}
