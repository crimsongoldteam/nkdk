import type { TypeDescriptionView } from "./typeDescriptionView"
import type { FillValueTypedValue } from "./fillValueSemantics"
import type { XmlAnomalyValidationState } from "../../validation/xmlAnomalyBoundary"
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
      readonly xmlAnomaly?: XmlAnomalyValidationState
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

export type DependentImportDependencyContext = Pick<DependentItemParams,
  "itemType" | "itemName" | "itemYamlPath" | "rootRule" | "owner">

export interface DependentImportDependencies {
  readonly item: readonly string[]
  readonly root: readonly (string | DependentCollectionSelection)[]
}

interface DependentCollectionSelection {
  readonly collection: string
  readonly properties: readonly string[]
}

export function dependentRootPropertyKey(selection: string | DependentCollectionSelection): string {
  return typeof selection === "string" ? selection : selection.collection
}

function selectDependencyCollection(source: unknown, selection: DependentCollectionSelection): unknown {
  if (source === null || typeof source !== "object" || Array.isArray(source)) return source
  return Object.fromEntries(Object.keys(source).map(name => {
    const child: unknown = Reflect.get(source, name)
    return [name, child !== null && typeof child === "object" && !Array.isArray(child)
      ? Object.fromEntries(selection.properties.filter(key => Object.hasOwn(child, key)).map(key => [key, Reflect.get(child, key)]))
      : child]
  }))
}

export interface DependentImportItemHandler {
  readonly propertyKeys: readonly string[]
  readonly dependencies: DependentImportDependencies
    | ((context: DependentImportDependencyContext) => DependentImportDependencies)
  shouldRemove(params: DependentItemParams & { readonly candidate: DependentImportedPropertyCandidate }): boolean
  shouldTagXML?(params: DependentItemParams & { readonly candidate: DependentImportedPropertyCandidate }): boolean
  shouldDefer?(params: DependentItemParams & { readonly candidate: DependentImportedPropertyCandidate }): boolean
}

export interface DependentImportFacts {
  readonly item: Readonly<Record<string, unknown>>
  readonly root: Readonly<Record<string, unknown>>
}

export interface DependentItemRegistryLookup {
  dependentImportDependencies(context: DependentImportDependencyContext): DependentImportDependencies | undefined
  prepareDependentImportFacts(params: DependentItemParams): DependentImportFacts | undefined
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

export function dependentImportDependencies(context: DependentImportDependencyContext): DependentImportDependencies | undefined {
  return currentPropertyRuleRegistrySet<DependentItemRegistryLookup>()?.dependentImportDependencies(context)
}

export function selectDependentImportFacts(
  dependencies: DependentImportDependencies,
  params: Pick<DependentItemParams, "item" | "rootYaml">,
): DependentImportFacts {
  const select = (source: unknown, keys: readonly string[]): Record<string, unknown> => {
    if (source === null || typeof source !== "object") return {}
    return Object.fromEntries(keys.filter(key => Object.hasOwn(source, key))
      .map(key => [key, Reflect.get(source, key)]))
  }
  const root = select(params.rootYaml, dependencies.root.map(dependentRootPropertyKey))
  for (const selection of dependencies.root) {
    if (typeof selection !== "string" && Object.hasOwn(root, selection.collection)) {
      root[selection.collection] = selectDependencyCollection(root[selection.collection], selection)
    }
  }
  return { item: select(params.item, dependencies.item), root }
}

export function prepareDependentImportFacts(params: DependentItemParams): DependentImportFacts | undefined {
  return currentPropertyRuleRegistrySet<DependentItemRegistryLookup>()?.prepareDependentImportFacts(params)
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
