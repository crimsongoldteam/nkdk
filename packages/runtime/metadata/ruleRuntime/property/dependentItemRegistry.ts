import type { TypeDescriptionView } from "./typeDescriptionView"
import type { FillValueTypedValue } from "./fillValueSemantics"
import type { DefinedTypeLookup } from "./fillValueSemantics"
import { currentPropertyRuleRegistrySet } from "./propertyRuleExecutionContext"

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
  readonly definedTypeLookup?: DefinedTypeLookup
  readonly metadataTargetLookup?: (canonical: string) => "found" | "missing" | "ambiguous"
}

export interface DependentYamlItemAnalysis {
  readonly diagnostics: readonly DependentDiagnostic[]
  readonly references: readonly DependentReferenceCandidate[]
  readonly projectChecks: readonly DependentProjectCheckCandidate[]
}

export type DependentProjectCheckCandidate =
  | {
      readonly kind: "fillValue"
      readonly yamlPath: DependentYamlPath
      readonly itemType: string
      readonly type: TypeDescriptionView
      readonly value: FillValueTypedValue
      readonly tagged: boolean
      readonly transport?: "DesignTimeRef"
    }
  | {
      readonly kind: "referenceCoverage"
      readonly yamlPath: DependentYamlPath
      readonly requirements: readonly {
        readonly message: string
        readonly candidates: readonly string[]
        readonly coveredBy: readonly string[]
      }[]
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
  shouldDefer?(params: DependentItemParams & { readonly candidate: DependentImportedPropertyCandidate }): boolean
}

export interface DependentItemRegistryLookup {
  analyzeDependentYamlItem(params: DependentYamlItemParams): DependentYamlItemAnalysis
  collectDependentStructuralItemReferences(params: DependentStructuralItemParams): readonly DependentStructuralItemReference[]
  isDependentImportProperty(itemType: string, propertyKey: string): boolean
  shouldRemoveImportedDependentProperty(
    params: DependentItemParams & { readonly candidate: DependentImportedPropertyCandidate },
  ): boolean
  shouldTagImportedDependentProperty(
    params: DependentItemParams & { readonly candidate: DependentImportedPropertyCandidate },
  ): boolean
  shouldDeferImportedDependentProperty(
    params: DependentItemParams & { readonly candidate: DependentImportedPropertyCandidate },
  ): boolean
}

export function analyzeDependentYamlItem(params: DependentYamlItemParams): DependentYamlItemAnalysis {
  return currentPropertyRuleRegistrySet<DependentItemRegistryLookup>()?.analyzeDependentYamlItem(params)
    ?? { diagnostics: [], references: [], projectChecks: [] }
}

export function collectDependentStructuralItemReferences(
  params: DependentStructuralItemParams
): readonly DependentStructuralItemReference[] {
  return currentPropertyRuleRegistrySet<DependentItemRegistryLookup>()?.collectDependentStructuralItemReferences(params) ?? []
}

export function isDependentImportProperty(itemType: string, propertyKey: string): boolean {
  return currentPropertyRuleRegistrySet<DependentItemRegistryLookup>()?.isDependentImportProperty(itemType, propertyKey) ?? false
}

export function shouldRemoveImportedDependentProperty(
  params: DependentItemParams & { readonly candidate: DependentImportedPropertyCandidate }
): boolean {
  return currentPropertyRuleRegistrySet<DependentItemRegistryLookup>()?.shouldRemoveImportedDependentProperty(params) ?? false
}

export function shouldTagImportedDependentProperty(
  params: DependentItemParams & { readonly candidate: DependentImportedPropertyCandidate }
): boolean {
  return currentPropertyRuleRegistrySet<DependentItemRegistryLookup>()?.shouldTagImportedDependentProperty(params) ?? false
}

export function shouldDeferImportedDependentProperty(
  params: DependentItemParams & { readonly candidate: DependentImportedPropertyCandidate }
): boolean {
  return currentPropertyRuleRegistrySet<DependentItemRegistryLookup>()?.shouldDeferImportedDependentProperty(params) ?? false
}
