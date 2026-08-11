import type { Diagnostic } from "../../diagnostics/types"
import type { OwnerFactRole } from "../../ruleRuntime/property/ownerFactRole"
import type { TypeDescriptionView } from "../../ruleRuntime/property/typeDescriptionView"
import type { ElementType } from "../../ruleRuntime/formElement/types"
import type {
  DataPathTableInfo,
  DataPathTypeInfo,
  FormDataPathColumnSource,
  OwnerTypeRef,
} from "../../ruleRuntime/dataPath/types"
import type { DataPathAllowedKind } from "../../ruleRuntime/property/types"
import type { MetadataTargetConstraint, ParsedMetadataTarget } from "../../ruleRuntime/metadataTarget/types"
import type { ProjectStateFileIdentity } from "./fileIdentity"
import type { FillValueTypedValue } from "../../ruleRuntime/property/fillValueSemantics"

export type ProjectStateDiagnostic = Omit<Diagnostic, "filePath">
export type ProjectStateYamlPath = readonly (string | number)[]
export interface ProjectStateStructuredDocumentEntry {
  readonly documentKind: string
  readonly representation: string
  readonly logicalAddress: string
  readonly workingProjectPath: string
  readonly componentKind: string
  readonly name: string
  readonly yamlPath: ProjectStateYamlPath
  readonly payload?: string
}

export interface ProjectStateResourceUpdate extends ProjectStateFileIdentity {
  readonly kind: "resource"
  readonly targets: readonly ProjectStateTargetEntry[]
}
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
export interface ProjectStateFileBackedTargetLocation {
  readonly itemProjectPath: string
  readonly ownerProjectPath: string
}
export interface ProjectStateTargetEntry {
  readonly kind: "object" | "member" | "value"
  readonly canonical: string
  readonly details?: ProjectStateReferenceDetails
  readonly fileBacked?: ProjectStateFileBackedTargetLocation
}
export type ProjectStateReferenceEntry = ProjectStateTargetEntry
export interface ProjectStatePendingReference {
  readonly yamlPath: ProjectStateYamlPath
  readonly canonical: string
  readonly target: ParsedMetadataTarget
  readonly constraint: MetadataTargetConstraint
  readonly tagged?: "xml"
}
export type ProjectStateNamedTypeItems = Array<{ name: string; type?: TypeDescriptionView }>
export interface ProjectStateOwnerFacts {
  readonly [key: string]: unknown
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
  | { readonly kind: "tabularElement"; readonly owner: OwnerTypeRef; readonly name: string; readonly dataPath?: string }
export type ProjectStatePendingDependencyCheck =
  | {
      readonly kind: "dataPath"
      readonly yamlPath: ProjectStateYamlPath
      readonly location: { readonly line: number; readonly col: number; readonly path?: string }
      readonly owner: OwnerTypeRef
      readonly value: string
      readonly tagged: boolean
      readonly policyInput: { readonly yaml: string; readonly allowedKinds?: readonly DataPathAllowedKind[]; readonly allowComposite?: boolean }
      readonly elementType?: ElementType
      readonly hasValuesPicture?: boolean
      readonly tableContext?: { readonly dataPath: string }
      readonly policy: "formDataPath"
    }
  | {
      readonly kind: "fillValue"
      readonly yamlPath: ProjectStateYamlPath
      readonly location: { readonly line: number; readonly col: number; readonly path?: string }
      readonly itemType: string
      readonly type: TypeDescriptionView
      readonly value: FillValueTypedValue
      readonly tagged: boolean
      readonly transport?: "DesignTimeRef"
    }
  | {
      readonly kind: "addressableRequired"
      readonly yamlPath: ProjectStateYamlPath
      readonly location: { readonly line: number; readonly col: number; readonly path?: string }
      readonly canonicalTarget: string
      readonly missing: readonly string[]
    }
export interface ProjectStateYamlFileUpdate extends ProjectStateFileIdentity {
  readonly kind: "yaml"
  readonly localValidation: ProjectStateLocalValidationResult
  readonly targets: readonly ProjectStateTargetEntry[]
  readonly pendingReferences: readonly ProjectStatePendingReference[]
  readonly owners: readonly ProjectStateOwnerFact[]
  readonly fields: readonly ProjectStateFieldEntry[]
  readonly forms: readonly ProjectStateFormEntry[]
  readonly pendingChecks: readonly ProjectStatePendingDependencyCheck[]
  readonly dependencies: readonly string[]
  readonly structuredDocuments?: readonly ProjectStateStructuredDocumentEntry[]
}
export interface ProjectStateImportIndexContribution extends ProjectStateFileIdentity {
  readonly resourceKind: "yaml"
  readonly yamlRole: NonNullable<ProjectStateFileIdentity["yamlRole"]>
  readonly targets: readonly ProjectStateTargetEntry[]
  readonly owners: readonly ProjectStateOwnerFact[]
  readonly fields: readonly ProjectStateFieldEntry[]
  readonly forms: readonly ProjectStateFormEntry[]
  readonly structuredDocuments?: readonly ProjectStateStructuredDocumentEntry[]
}
export type ProjectStateFileUpdate = ProjectStateResourceUpdate | ProjectStateYamlFileUpdate
export interface ProjectStateFileUpdateBatch { readonly updates: readonly ProjectStateFileUpdate[]; readonly hashBytes: Uint8Array }
export interface ProjectStateEncodedFileUpdateBatch { readonly bytes: Uint8Array<ArrayBuffer> }
export type ProjectStateFileUpdateBatchEntry =
  | { readonly update: ProjectStateFileUpdate; readonly hash: bigint; readonly hashBytes?: never }
  | { readonly update: ProjectStateFileUpdate; readonly hash?: never; readonly hashBytes: Uint8Array }

export type ProjectStateOwnerFactRole = OwnerFactRole
export type { ProjectStateFileIdentity } from "./fileIdentity"
