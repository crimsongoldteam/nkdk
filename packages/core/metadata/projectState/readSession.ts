import type { OwnerTypeRef } from "../orchestration/dataPath/types"
import type {
  ProjectStateFieldEntry,
  ProjectStateFormEntry,
  ProjectStateOwnerFacts,
  ProjectStatePendingDependencyCheck,
  ProjectStateReferenceEntry,
} from "./contracts/fileUpdate"
import type { ProjectStateReadToken } from "./contracts/readToken"

export interface ProjectTargetLookup {
  readonly requestId: string
  readonly componentPath: string
  readonly canonicalTarget: string
}

export type ProjectTargetLookupResult =
  | {
      readonly requestId: string
      readonly status: "found"
      readonly target: ProjectStateReferenceEntry
      readonly source: { readonly projectPath: string; readonly componentPath: string }
    }
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
  readonly match?: "exact" | "prefix"
  readonly dataPathTarget?: {
    readonly owner: OwnerTypeRef
    readonly fieldName?: string
  }
}

export type ProjectReferenceLocation = ProjectMetadataTargetReferenceLocation | ProjectDataPathReferenceLocation

export interface ProjectMetadataTargetReferenceLocation {
  readonly kind: "metadataTarget"
  readonly projectPath: string
  readonly componentPath: string
  readonly yamlPath: readonly (string | number)[]
  readonly canonical: string
}

export interface ProjectDataPathReferenceLocation {
  readonly kind: "dataPath"
  readonly projectPath: string
  readonly componentPath: string
  readonly yamlPath: readonly (string | number)[]
  readonly value: string
  readonly resolvedSegments: readonly string[]
  readonly segmentIndex: number
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

export interface ProjectComponentTargetPageQuery {
  readonly componentPath: string
  readonly cursor?: string
}

export interface ProjectComponentTargetPage {
  readonly entries: readonly {
    readonly logicalAddress: string
    readonly sourceProjectPath: string
  }[]
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
  readComponentTargetPage(query: ProjectComponentTargetPageQuery): ProjectComponentTargetPage
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

export function createProjectStateReadSession(params: {
  readonly token: ProjectStateReadToken
  readonly queryPort: ProjectStateQueryPort
  readonly beforeRead?: () => void
  readonly close?: () => void
  readonly onClose?: (session: ProjectStateReadSession) => void
}): ProjectStateReadSession {
  let closed = false
  const session: ProjectStateReadSession = {
    resolveTargets: (requests) => read(() => params.queryPort.resolveTargets(requests)),
    readOwners: (requests) => read(() => params.queryPort.readOwners(requests)),
    findReferences: (requests) => read(() => params.queryPort.findReferences(requests)),
    readDependencyInputs: (requests) => read(() => params.queryPort.readDependencyInputs(requests)),
    readDependencyOwnerInputs: (requests) => read(() => params.queryPort.readDependencyOwnerInputs(requests)),
    readOwnerRefPage: (query) => read(() => params.queryPort.readOwnerRefPage(query)),
    readComponentTargetPage: (query) => read(() => params.queryPort.readComponentTargetPage(query)),
    readValidationStatus: (query) => read(() => params.queryPort.readValidationStatus(query)),
    close() {
      if (closed) return
      closed = true
      params.close?.()
      params.onClose?.(session)
    },
  }
  return session

  function read<T>(operation: () => T): T {
    if (closed) throw new ProjectStateReadSessionClosedError(params.token)
    try {
      params.beforeRead?.()
    } catch (caught) {
      session.close()
      throw caught
    }
    return operation()
  }
}
