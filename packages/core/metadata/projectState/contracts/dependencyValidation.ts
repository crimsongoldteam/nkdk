import type { Diagnostic } from "../../diagnostics/types"
import type { MetadataTargetConstraint, ParsedMetadataTarget } from "../../ruleRuntime/metadataTarget/types"
import type { OwnerTypeRef } from "../../ruleRuntime/dataPath/types"
import type {
  ProjectStateFieldEntry,
  ProjectStateFormEntry,
  ProjectStateOwnerFacts,
  ProjectStatePendingDependencyCheck,
  ProjectStateReferenceEntry,
  ProjectStateStructuredDocumentEntry,
  ProjectStateYamlPath,
} from "./fileUpdate"
import type { ProjectStateReadToken } from "./readToken"

export interface ProjectTargetLookup { readonly requestId: string; readonly componentPath: string; readonly canonicalTarget: string }
export type ProjectTargetLookupResult =
  | { readonly requestId: string; readonly status: "found"; readonly target: ProjectStateReferenceEntry; readonly source: { readonly projectPath: string; readonly componentPath: string } }
  | { readonly requestId: string; readonly status: "ambiguous" | "missing" }
export interface ProjectOwnerLookup { readonly requestId: string; readonly componentPath: string; readonly owner: OwnerTypeRef }
export type ProjectOwnerLookupResult =
  | { readonly requestId: string; readonly status: "found"; readonly facts: ProjectStateOwnerFacts }
  | { readonly requestId: string; readonly status: "ambiguous" | "missing" }
export interface ProjectReferenceLookup {
  readonly requestId: string
  readonly componentPath: string
  readonly canonical: string
  readonly match?: "exact" | "prefix"
  readonly dataPathTarget?: { readonly owner: OwnerTypeRef; readonly fieldName?: string }
}
export interface ProjectMetadataTargetReferenceLocation { readonly kind: "metadataTarget"; readonly projectPath: string; readonly componentPath: string; readonly yamlPath: ProjectStateYamlPath; readonly canonical: string }
export interface ProjectDataPathReferenceLocation { readonly kind: "dataPath"; readonly projectPath: string; readonly componentPath: string; readonly yamlPath: ProjectStateYamlPath; readonly value: string; readonly resolvedSegments: readonly string[]; readonly segmentIndex: number }
export type ProjectReferenceLocation = ProjectMetadataTargetReferenceLocation | ProjectDataPathReferenceLocation
export interface ProjectReferenceLookupResult { readonly requestId: string; readonly references: readonly ProjectReferenceLocation[] }
export interface ProjectDependencyInputQuery { readonly requestId: string; readonly componentPath: string; readonly projectPath: string; readonly check: ProjectStatePendingDependencyCheck }
export interface ProjectDependencyInput { readonly owners: readonly { readonly owner: OwnerTypeRef; readonly facts: ProjectStateOwnerFacts }[]; readonly fields: readonly ProjectStateFieldEntry[]; readonly forms: readonly ProjectStateFormEntry[] }
export type ProjectDependencyInputResult = { readonly requestId: string; readonly status: "found"; readonly input: ProjectDependencyInput } | { readonly requestId: string; readonly status: "missing" }
export interface ProjectDependencyOwnerInputQuery { readonly requestId: string; readonly componentPath: string; readonly owner: OwnerTypeRef }
export interface ProjectDependencyOwnerInput { readonly owner: OwnerTypeRef; readonly facts: ProjectStateOwnerFacts; readonly fields: readonly ProjectStateFieldEntry[] }
export type ProjectDependencyOwnerInputResult = { readonly requestId: string; readonly status: "found"; readonly input: ProjectDependencyOwnerInput } | { readonly requestId: string; readonly status: "missing" }
export interface ProjectOwnerRefPageQuery { readonly componentPath: string; readonly kind: OwnerTypeRef["kind"]; readonly cursor?: string }
export interface ProjectOwnerRefPage { readonly refs: readonly OwnerTypeRef[]; readonly nextCursor?: string }
export interface ProjectComponentTargetPageQuery { readonly componentPath: string; readonly cursor?: string }
export interface ProjectComponentTargetPage { readonly entries: readonly { readonly logicalAddress: string; readonly sourceProjectPath: string }[]; readonly nextCursor?: string }
export interface ProjectValidationStatusQuery { readonly offset: number; readonly batchSize: number }
export interface ProjectValidationStatusRow { readonly projectPath: string; readonly componentPath: string; readonly schemaReady?: boolean; readonly contributedFacts?: boolean }
export interface ProjectFileMetadataTargetReferencesQuery { readonly requestId: string; readonly componentPath: string; readonly projectPath: string }
export type ProjectFileMetadataTargetReferencesResult =
  | { readonly requestId: string; readonly status: "found"; readonly references: readonly { readonly yamlPath: ProjectStateYamlPath; readonly canonical: string }[] }
  | { readonly requestId: string; readonly status: "missing" }
export interface ProjectStructuredDocumentQuery { readonly componentPath: string; readonly logicalAddress: string }
export interface ProjectStateStructuredDocumentFact {
  readonly componentPath: string
  readonly projectPath: string
  readonly entry: ProjectStateStructuredDocumentEntry
}

export interface ProjectStateQueryPort {
  resolveTargets(requests: readonly ProjectTargetLookup[]): readonly ProjectTargetLookupResult[]
  readOwners(requests: readonly ProjectOwnerLookup[]): readonly ProjectOwnerLookupResult[]
  findReferences(requests: readonly ProjectReferenceLookup[]): readonly ProjectReferenceLookupResult[]
  readDependencyInputs(requests: readonly ProjectDependencyInputQuery[]): readonly ProjectDependencyInputResult[]
  readDependencyOwnerInputs(requests: readonly ProjectDependencyOwnerInputQuery[]): readonly ProjectDependencyOwnerInputResult[]
  readOwnerRefPage(query: ProjectOwnerRefPageQuery): ProjectOwnerRefPage
  readComponentTargetPage(query: ProjectComponentTargetPageQuery): ProjectComponentTargetPage
  readValidationStatus(query: ProjectValidationStatusQuery): readonly ProjectValidationStatusRow[]
  readFileMetadataTargetReferences(requests: readonly ProjectFileMetadataTargetReferencesQuery[]): readonly ProjectFileMetadataTargetReferencesResult[]
  readStructuredDocumentEntries(query: ProjectStructuredDocumentQuery): readonly ProjectStateStructuredDocumentEntry[]
}

export interface ProjectStateReadSession extends ProjectStateQueryPort { close(): void }
export interface ProjectStateReadSessionFactory { openReadSession(token: ProjectStateReadToken): ProjectStateReadSession }

export interface ProjectStatePendingMetadataTargetReference {
  readonly filePath: string
  readonly yamlPath: ProjectStateYamlPath
  readonly canonical: string
  readonly target: ParsedMetadataTarget
  readonly constraint: MetadataTargetConstraint
}
export interface ProjectStatePendingReferenceCheck { readonly requestId: string; readonly componentPath: string; readonly reference: ProjectStatePendingMetadataTargetReference }
export interface ProjectStatePendingOwnerCheck { readonly requestId: string; readonly componentPath: string; readonly owner: OwnerTypeRef }
export interface ProjectStateDataPathReferenceCheck { readonly requestId: string; readonly componentPath: string; readonly projectPath: string; readonly check: Extract<ProjectStatePendingDependencyCheck, { kind: "dataPath" }> }
export interface ProjectStateDependencyReadiness { readonly blockedComponentPaths: ReadonlySet<string>; readonly diagnostics: readonly Diagnostic[] }
export interface ProjectStateResolvedDataPathProjection { readonly requestId: string; readonly componentPath: string; readonly projectPath: string; readonly resolvedSegments: readonly string[]; readonly sourceOwner: OwnerTypeRef; readonly sourceFieldName?: string }

export interface ProjectStateReadinessParams { readonly queryPort: Pick<ProjectStateQueryPort, "readValidationStatus"> }
export interface ProjectStateResolveDataPathsParams { readonly checks: readonly ProjectStateDataPathReferenceCheck[]; readonly projectDir: string; readonly queryPort: Pick<ProjectStateQueryPort, "readDependencyInputs" | "readDependencyOwnerInputs"> }
export interface ProjectStateReferenceValidationParams { readonly checks: readonly ProjectStatePendingReferenceCheck[]; readonly projectDir: string; readonly queryPort: Pick<ProjectStateQueryPort, "resolveTargets"> }
export interface ProjectStateOwnerValidationParams { readonly checks: readonly ProjectStatePendingOwnerCheck[]; readonly projectDir: string; readonly queryPort: Pick<ProjectStateQueryPort, "readOwners"> }
export interface ProjectStateDependencyValidationParams { readonly checks: readonly ProjectDependencyInputQuery[]; readonly projectDir: string; readonly queryPort: Pick<ProjectStateQueryPort, "readDependencyInputs" | "readDependencyOwnerInputs" | "readOwnerRefPage"> }
export interface ProjectStateStructuredDocumentValidationParams {
  readonly facts: readonly ProjectStateStructuredDocumentFact[]
  readonly projectDir: string
  readonly queryPort: Pick<ProjectStateQueryPort,
    "readStructuredDocumentEntries" | "readDependencyInputs" | "readDependencyOwnerInputs">
}
export type ProjectStateStructuredDocumentValidator = (
  params: ProjectStateStructuredDocumentValidationParams,
) => readonly Diagnostic[]

export interface ProjectStateDependencyValidator {
  readReadiness(params: ProjectStateReadinessParams): ProjectStateDependencyReadiness
  resolveDataPaths(params: ProjectStateResolveDataPathsParams): readonly ProjectStateResolvedDataPathProjection[]
  validateReferences(params: ProjectStateReferenceValidationParams): readonly Diagnostic[]
  validateOwners(params: ProjectStateOwnerValidationParams): readonly Diagnostic[]
  validateDependencies(params: ProjectStateDependencyValidationParams): readonly Diagnostic[]
  validateStructuredDocuments(params: ProjectStateStructuredDocumentValidationParams): readonly Diagnostic[]
}
