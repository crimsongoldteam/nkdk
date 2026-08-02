import type { OwnerTypeRef } from "../validation/dataPath/types"
import type {
  ProjectStateFieldEntry,
  ProjectStateFormEntry,
  ProjectStateOwnerFacts,
  ProjectStatePendingDependencyCheck,
  ProjectStateReferenceEntry,
} from "./fileUpdate"
import type { ProjectStateReadToken } from "./contracts"

export interface ProjectTargetLookup {
  readonly requestId: string
  readonly componentPath: string
  readonly canonicalTarget: string
}

export type ProjectTargetLookupResult =
  | { readonly requestId: string; readonly status: "found"; readonly target: ProjectStateReferenceEntry }
  | { readonly requestId: string; readonly status: "ambiguous" }
  | { readonly requestId: string; readonly status: "missing" }

export interface ProjectOwnerLookup {
  readonly requestId: string
  readonly componentPath: string
  readonly owner: OwnerTypeRef
}

export type ProjectOwnerLookupResult =
  | { readonly requestId: string; readonly status: "found"; readonly facts: ProjectStateOwnerFacts }
  | { readonly requestId: string; readonly status: "ambiguous" }
  | { readonly requestId: string; readonly status: "missing" }

export interface ProjectReferenceLookup {
  readonly requestId: string
  readonly componentPath: string
  readonly canonical: string
}

export interface ProjectReferenceLocation {
  readonly projectPath: string
  readonly componentPath: string
}

export interface ProjectReferenceLookupResult {
  readonly requestId: string
  readonly references: readonly ProjectReferenceLocation[]
}

export interface ProjectDependencyInputQuery {
  readonly requestId: string
  readonly componentPath: string
  readonly projectPath: string
  readonly check: ProjectStatePendingDependencyCheck
}

export interface ProjectDependencyInput {
  readonly owners: readonly { readonly owner: OwnerTypeRef; readonly facts: ProjectStateOwnerFacts }[]
  readonly fields: readonly ProjectStateFieldEntry[]
  readonly forms: readonly ProjectStateFormEntry[]
}

export type ProjectDependencyInputResult =
  | { readonly requestId: string; readonly status: "found"; readonly input: ProjectDependencyInput }
  | { readonly requestId: string; readonly status: "missing" }

export interface ProjectDependencyOwnerInputQuery {
  readonly requestId: string
  readonly componentPath: string
  readonly owner: OwnerTypeRef
}

export interface ProjectDependencyOwnerInput {
  readonly owner: OwnerTypeRef
  readonly facts: ProjectStateOwnerFacts
  readonly fields: readonly ProjectStateFieldEntry[]
}

export type ProjectDependencyOwnerInputResult =
  | { readonly requestId: string; readonly status: "found"; readonly input: ProjectDependencyOwnerInput }
  | { readonly requestId: string; readonly status: "missing" }

export interface ProjectOwnerRefPageQuery {
  readonly componentPath: string
  readonly kind: OwnerTypeRef["kind"]
  readonly cursor?: string
}

export interface ProjectOwnerRefPage {
  readonly refs: readonly OwnerTypeRef[]
  readonly nextCursor?: string
}

export interface ProjectValidationStatusQuery {
  readonly offset: number
  readonly batchSize: number
}

export interface ProjectValidationStatusRow {
  readonly projectPath: string
  readonly componentPath: string
  readonly schemaReady?: boolean
  readonly contributedFacts?: boolean
}

export interface ProjectStateQueryPort {
  resolveTargets(requests: readonly ProjectTargetLookup[]): readonly ProjectTargetLookupResult[]
  readOwners(requests: readonly ProjectOwnerLookup[]): readonly ProjectOwnerLookupResult[]
  findReferences(requests: readonly ProjectReferenceLookup[]): readonly ProjectReferenceLookupResult[]
  readDependencyInputs(requests: readonly ProjectDependencyInputQuery[]): readonly ProjectDependencyInputResult[]
  readDependencyOwnerInputs(
    requests: readonly ProjectDependencyOwnerInputQuery[]
  ): readonly ProjectDependencyOwnerInputResult[]
  readOwnerRefPage(query: ProjectOwnerRefPageQuery): ProjectOwnerRefPage
  readValidationStatus(query: ProjectValidationStatusQuery): readonly ProjectValidationStatusRow[]
}

export interface ProjectStateReadSession extends ProjectStateQueryPort {
  close(): void
}

export interface ProjectStateReadSessionFactory {
  openReadSession(token: ProjectStateReadToken): ProjectStateReadSession
}

export class ProjectStateReadSessionClosedError extends Error {
  constructor(_token: ProjectStateReadToken) {
    super("Сеанс чтения состояния проекта уже закрыт")
    this.name = "ProjectStateReadSessionClosedError"
  }
}
