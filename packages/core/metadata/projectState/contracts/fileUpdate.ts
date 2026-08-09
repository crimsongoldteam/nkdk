import type { Diagnostic } from "../../diagnostics/types"
import type { OwnerFactRole } from "../../orchestration/property/ownerFactRole"
import type { TypeDescriptionView } from "../../orchestration/property/typeDescriptionView"
import type { ElementType } from "../../orchestration/formElement/types"
import type {
  DataPathTableInfo,
  DataPathTypeInfo,
  FormDataPathColumnSource,
  OwnerTypeRef,
} from "../../orchestration/dataPath/types"
import type { DataPathAllowedKind } from "../../orchestration/property/types"
import type { MetadataTargetConstraint, ParsedMetadataTarget } from "../../orchestration/metadataTarget/types"
import type { ProjectStateFileIdentity } from "./fileIdentity"

export type ProjectStateDiagnostic = Omit<Diagnostic, "filePath">
export type ProjectStateYamlPath = readonly (string | number)[]

export interface ProjectStateResourceUpdate extends ProjectStateFileIdentity { readonly kind: "resource" }
export interface ProjectStateLocalValidationResult {
  readonly contributedFacts: boolean
  readonly diagnostics: readonly ProjectStateDiagnostic[]
  readonly schemaDiagnostics: readonly ProjectStateDiagnostic[]
}
export interface ProjectStateReferenceDetails {
  readonly kind?: "attribute" | "standardAttribute"
  readonly typeInfo?: { readonly kinds: readonly string[]; readonly sourceText?: string; readonly definedTypes?: readonly string[] }
  readonly styleItemType?: "Color" | "Font" | "Border"
}
export interface ProjectStateReferenceEntry {
  readonly kind: "object" | "member" | "value"
  readonly canonical: string
  readonly details?: ProjectStateReferenceDetails
}
export interface ProjectStatePendingReference {
  readonly yamlPath: ProjectStateYamlPath
  readonly canonical: string
  readonly target: ParsedMetadataTarget
  readonly constraint: MetadataTargetConstraint
}
export type ProjectStateNamedTypeItems = Array<{ name: string; type?: TypeDescriptionView }>
export interface ProjectStateOwnerFacts {
  type?: TypeDescriptionView
  commonAttributeOwnerLinks?: string[]
  owners?: string[]
  task?: string
  registerRecords?: string[]
  chartOfAccounts?: string
  extDimensionTypes?: string
  accountingFlags?: ProjectStateNamedTypeItems
  extDimensionAccountingFlags?: ProjectStateNamedTypeItems
  registerType?: string
  attributes?: ProjectStateNamedTypeItems
  dimensions?: ProjectStateNamedTypeItems
  resources?: ProjectStateNamedTypeItems
  addressingAttributes?: ProjectStateNamedTypeItems
  tabularSections?: Array<{ name: string; attributes: ProjectStateNamedTypeItems; standardAttributes?: ProjectStateNamedTypeItems }>
  standardAttributes?: ProjectStateNamedTypeItems
  commands?: ProjectStateNamedTypeItems
}
export interface ProjectStateOwnerFact { readonly owner: OwnerTypeRef; readonly facts: ProjectStateOwnerFacts }
export type ProjectStateObjectFieldKind = "attribute" | "standardAttribute" | "tabularSection" | "dimension" | "resource" | "addressingAttribute"
export interface ProjectStateFieldEntry {
  readonly owner: OwnerTypeRef
  readonly name: string
  readonly kind: ProjectStateObjectFieldKind
  readonly typeInfo: DataPathTypeInfo
  readonly targetName?: string
  readonly sourceCollection?: string
  readonly parentName?: string
  readonly table?: DataPathTableInfo
  readonly tableHasColumns?: boolean
}
export interface ProjectStateFormSource {
  readonly kind: "formAttribute"
  readonly name: string
  readonly typeInfo: DataPathTypeInfo
  readonly table?: DataPathTableInfo
  readonly tableHasColumns?: boolean
}
export type ProjectStateFormEntry =
  | { readonly kind: "root"; readonly owner: OwnerTypeRef; readonly name: string; readonly source: ProjectStateFormSource }
  | { readonly kind: "additionalColumn"; readonly owner: OwnerTypeRef; readonly tablePath: string; readonly name: string; readonly source: FormDataPathColumnSource }
  | { readonly kind: "tableDataPath"; readonly owner: OwnerTypeRef; readonly name: string; readonly dataPath: string }
export interface ProjectStatePendingDependencyCheck {
  readonly kind: "dataPath"
  readonly yamlPath: ProjectStateYamlPath
  readonly location: { readonly line: number; readonly col: number; readonly path?: string }
  readonly owner: OwnerTypeRef
  readonly value: string
  readonly policyInput: { readonly yaml: string; readonly allowedKinds?: readonly DataPathAllowedKind[]; readonly allowComposite?: boolean }
  readonly elementType?: ElementType
  readonly hasValuesPicture?: boolean
  readonly tableContext?: { readonly dataPath: string }
  readonly policy: "formDataPath"
}
export interface ProjectStateYamlFileUpdate extends ProjectStateFileIdentity {
  readonly kind: "yaml"
  readonly localValidation: ProjectStateLocalValidationResult
  readonly references: readonly ProjectStateReferenceEntry[]
  readonly pendingReferences: readonly ProjectStatePendingReference[]
  readonly owners: readonly ProjectStateOwnerFact[]
  readonly fields: readonly ProjectStateFieldEntry[]
  readonly forms: readonly ProjectStateFormEntry[]
  readonly pendingChecks: readonly ProjectStatePendingDependencyCheck[]
  readonly dependencies: readonly string[]
}
export type ProjectStateFileUpdate = ProjectStateResourceUpdate | ProjectStateYamlFileUpdate
export interface ProjectStateFileUpdateBatch { readonly updates: readonly ProjectStateFileUpdate[]; readonly hashBytes: Uint8Array }
export type ProjectStateFileUpdateBatchEntry =
  | { readonly update: ProjectStateFileUpdate; readonly hash: bigint; readonly hashBytes?: never }
  | { readonly update: ProjectStateFileUpdate; readonly hash?: never; readonly hashBytes: Uint8Array }

export type ProjectStateOwnerFactRole = OwnerFactRole
