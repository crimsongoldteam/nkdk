import type { OwnerTypeRef } from "../../ruleRuntime/dataPath/types"
import type { ProjectStateDependencyValidator } from "../contracts/dependencyValidation"
import type {
  ProjectStateLocalValidationResult,
  ProjectStateOwnerFact,
  ProjectStatePendingDependencyCheck,
  ProjectStateYamlFileUpdate,
} from "../fileUpdate"
import type { ProjectStateReadToken } from "../contracts"
import {
  createProjectStateReadSession,
  type ProjectComponentTargetPage,
  type ProjectDependencyInput,
  type ProjectDependencyInputQuery,
  type ProjectDependencyOwnerInputQuery,
  type ProjectFileMetadataTargetReferencesQuery,
  type ProjectFileMetadataTargetReferencesResult,
  type ProjectOwnerLookup,
  type ProjectOwnerLookupResult,
  type ProjectOwnerRefPage,
  type ProjectOwnerRefPageQuery,
  type ProjectReferenceLocation,
  type ProjectReferenceLookup,
  type ProjectStateQueryPort,
  type ProjectStateReadSession,
  type ProjectTargetLookup,
  type ProjectTargetLookupResult,
} from "../readSession"
import { claimBinaryProjectStateReadToken } from "./readToken"
import { decodeBinaryOwnerKey, encodeBinaryOwnerKey } from "./ownerKey"
import { ProjectStateSnapshotView } from "./snapshot"
import {
  createTypedProjectStateReader,
  hasTypedProjectStateFacts,
  type TypedProjectStateReader,
} from "./typedReader"

type DecodedYamlFacts = Pick<
  ProjectStateYamlFileUpdate,
  "targets" | "pendingReferences" | "owners" | "fields" | "forms" | "pendingChecks" | "dependencies"
>
type ReadYamlFacts = (fileId: number) => DecodedYamlFacts | undefined
type ReadReferenceDetails = TypedProjectStateReader["referenceDetails"]
type ReadOwners = TypedProjectStateReader["owners"]
type ReadFields = TypedProjectStateReader["fields"]
type ReadForms = TypedProjectStateReader["forms"]
type WithoutRequestId<T> = T extends unknown ? Omit<T, "requestId"> : never
type CachedTargetLookupResult = WithoutRequestId<ProjectTargetLookupResult>

const PAGE_SIZE = 2_000

export function createBinaryProjectStateQueryPort(
  snapshot: ProjectStateSnapshotView,
  options: {
    readonly pageSize?: number
    readonly typedReader?: TypedProjectStateReader
    readonly dependencyValidator: ProjectStateDependencyValidator
  },
): ProjectStateQueryPort {
  const pageSize = options.pageSize ?? PAGE_SIZE
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) {
    throw new Error("pageSize должен быть положительным целым числом")
  }
  const typedReader = options.typedReader ?? (
    hasTypedProjectStateFacts(snapshot) ? createTypedProjectStateReader(snapshot) : undefined
  )
  const readYamlFacts = createYamlFactsReader(snapshot, typedReader)
  const readReferenceDetails: ReadReferenceDetails = typedReader === undefined
    ? (fileId, kind, canonical) => readYamlFacts(fileId)?.targets.find(
        (reference) => reference.kind === kind && reference.canonical === canonical,
      )?.details
    : (fileId, kind, canonical) => typedReader.referenceDetails(fileId, kind, canonical)
  const readOwners: ReadOwners = typedReader === undefined
    ? (fileId) => readYamlFacts(fileId)?.owners ?? []
    : (fileId) => typedReader.owners(fileId)
  const readFields: ReadFields = typedReader === undefined
    ? (fileId) => readYamlFacts(fileId)?.fields ?? []
    : (fileId) => typedReader.fields(fileId)
  const readForms: ReadForms = typedReader === undefined
    ? (fileId) => readYamlFacts(fileId)?.forms ?? []
    : (fileId) => typedReader.forms(fileId)
  const targetLookupCache = new Map<string, CachedTargetLookupResult>()
  const queryPort: ProjectStateQueryPort = {
    resolveTargets(requests) {
      return resolveTargets(snapshot, readReferenceDetails, targetLookupCache, requests)
    },
    readOwners: (requests) => requests.map((request) => readOwner(snapshot, readOwners, request)),
    findReferences: (requests) => findReferences(
      snapshot,
      readYamlFacts,
      queryPort,
      options.dependencyValidator,
      requests,
    ),
    readDependencyInputs: (requests) => readDependencyInputs(
      snapshot,
      readOwners,
      readFields,
      readForms,
      requests,
    ),
    readDependencyOwnerInputs: (requests) =>
      readDependencyOwnerInputs(snapshot, readOwners, readFields, requests),
    readOwnerRefPage: (query) => readOwnerRefPage(snapshot, query, pageSize),
    readComponentTargetPage: (query) => readComponentTargetPage(snapshot, query, pageSize),
    readValidationStatus: (query) => readValidationStatus(snapshot, typedReader, query),
    readFileMetadataTargetReferences: (requests) =>
      readFileMetadataTargetReferences(snapshot, readYamlFacts, requests),
  }
  return queryPort
}

function readFileMetadataTargetReferences(
  snapshot: ProjectStateSnapshotView,
  readYamlFacts: ReadYamlFacts,
  requests: readonly ProjectFileMetadataTargetReferencesQuery[],
): readonly ProjectFileMetadataTargetReferencesResult[] {
  return requests.map(({ requestId, componentPath, projectPath }) => {
    const fileId = snapshot.findFile(projectPath)
    if (fileId === undefined || snapshot.componentPath(fileId) !== componentPath) {
      return { requestId, status: "missing" as const }
    }
    const facts = readYamlFacts(fileId)
    if (facts === undefined) return { requestId, status: "missing" as const }
    return {
      requestId,
      status: "found" as const,
      references: facts.pendingReferences.map(({ yamlPath, canonical }) => ({ yamlPath, canonical })),
    }
  })
}

export function openBinaryProjectStateReadSession(
  token: ProjectStateReadToken,
  dependencyValidator: ProjectStateDependencyValidator,
): ProjectStateReadSession {
  const snapshot = new ProjectStateSnapshotView(claimBinaryProjectStateReadToken(token))
  const queryPort = createBinaryProjectStateQueryPort(snapshot, { dependencyValidator })
  return createProjectStateReadSession({ token, queryPort })
}

function resolveTargets(
  snapshot: ProjectStateSnapshotView,
  readReferenceDetails: ReadReferenceDetails,
  cache: Map<string, CachedTargetLookupResult>,
  requests: readonly ProjectTargetLookup[],
): readonly ProjectTargetLookupResult[] {
  return requests.map(({ requestId, componentPath, canonicalTarget }) => {
    const cacheKey = `${componentPath}\u0000${canonicalTarget}`
    const cached = cache.get(cacheKey)
    if (cached !== undefined) return { requestId, ...cached }
    const own = snapshot.lookupTarget(componentPath, canonicalTarget)
    const candidates = componentPath === "cf" || own.length > 0
      ? own
      : snapshot.lookupTarget("cf", canonicalTarget)
    if (candidates.length === 0) {
      const result = { status: "missing" as const }
      cache.set(cacheKey, result)
      return { requestId, ...result }
    }
    const candidate = coalesceTargetCandidates(candidates)
    if (candidate === undefined) {
      const result = { status: "ambiguous" as const }
      cache.set(cacheKey, result)
      return { requestId, ...result }
    }

    const details = readReferenceDetails(candidate.sourceFileId, candidate.kind, candidate.canonical)
    const result = {
      status: "found" as const,
      target: {
        kind: candidate.kind,
        canonical: candidate.canonical,
        ...(details === undefined ? {} : { details }),
        ...(candidate.itemProjectPath === undefined || candidate.ownerProjectPath === undefined
          ? {}
          : {
              fileBacked: {
                itemProjectPath: candidate.itemProjectPath,
                ownerProjectPath: candidate.ownerProjectPath,
              },
            }),
      },
      source: {
        projectPath: candidate.projectPath,
        componentPath: candidate.componentPath,
        ...(candidate.itemProjectPath === undefined ? {} : { itemProjectPath: candidate.itemProjectPath }),
        ...(candidate.ownerProjectPath === undefined ? {} : { ownerProjectPath: candidate.ownerProjectPath }),
      },
    }
    cache.set(cacheKey, result)
    return { requestId, ...result }
  })
}

function coalesceTargetCandidates<T extends {
  readonly componentPath: string
  readonly canonical: string
  readonly kind: string
  readonly itemProjectPath?: string
  readonly ownerProjectPath?: string
}>(candidates: readonly T[]): T | undefined {
  const first = candidates[0]
  if (first === undefined) return undefined
  if (candidates.length === 1) return first
  if (first.itemProjectPath === undefined || first.ownerProjectPath === undefined) return undefined
  return candidates.every((candidate) =>
    candidate.componentPath === first.componentPath
    && candidate.canonical === first.canonical
    && candidate.kind === first.kind
    && candidate.itemProjectPath === first.itemProjectPath
    && candidate.ownerProjectPath === first.ownerProjectPath
  ) ? first : undefined
}

function readOwner(
  snapshot: ProjectStateSnapshotView,
  readOwners: ReadOwners,
  request: ProjectOwnerLookup,
): ProjectOwnerLookupResult {
  const selected = selectOwnerFile(snapshot, readOwners, request.componentPath, request.owner)
  if (selected.status !== "found") return { requestId: request.requestId, status: selected.status }
  return {
    requestId: request.requestId,
    status: "found",
    facts: mergeOwnerFacts(selected.owners, request.owner),
  }
}

function selectOwnerFile(
  snapshot: ProjectStateSnapshotView,
  readOwners: ReadOwners,
  componentPath: string,
  owner: OwnerTypeRef,
):
  | { readonly status: "missing" | "ambiguous" }
  | { readonly status: "found"; readonly fileId: number; readonly owners: ReturnType<ReadOwners> } {
  const own: { fileId: number; owners: ReturnType<ReadOwners> }[] = []
  const base: { fileId: number; owners: ReturnType<ReadOwners> }[] = []
  const seen = new Set<number>()
  for (const { sourceFileId: fileId } of snapshot.lookupOwnerKey(encodeBinaryOwnerKey(owner))) {
    if (seen.has(fileId)) continue
    seen.add(fileId)
    const candidateComponent = snapshot.componentPath(fileId)
    if (!isVisible(componentPath, candidateComponent)) continue
    const owners = readOwners(fileId)
    if (!owners.some((entry) => sameOwner(entry.owner, owner))) continue
    ;(candidateComponent === componentPath ? own : base).push({ fileId, owners })
  }
  const candidates = own.length > 0 ? own : base
  if (candidates.length === 0) return { status: "missing" }
  if (candidates.length > 1) return { status: "ambiguous" }
  return { status: "found", ...candidates[0] }
}

function readDependencyInputs(
  snapshot: ProjectStateSnapshotView,
  readOwners: ReadOwners,
  readFields: ReadFields,
  readForms: ReadForms,
  requests: readonly ProjectDependencyInputQuery[],
) {
  return requests.map(({ requestId, componentPath, projectPath, check }) => {
    const selected = selectOwnerFile(snapshot, readOwners, componentPath, check.owner)
    if (selected.status !== "found") return { requestId, status: "missing" as const }
    const formFileId = snapshot.findFile(projectPath)
    const input: ProjectDependencyInput = {
      owners: selected.owners
        .filter(({ owner }) => sameOwner(owner, check.owner))
        .map(({ owner, facts }) => ({ owner, facts })),
      fields: readFields(selected.fileId).filter(({ owner }) => sameOwner(owner, check.owner)),
      forms: formFileId === undefined ? [] : readForms(formFileId),
    }
    return { requestId, status: "found" as const, input }
  })
}

function readDependencyOwnerInputs(
  snapshot: ProjectStateSnapshotView,
  readOwners: ReadOwners,
  readFields: ReadFields,
  requests: readonly ProjectDependencyOwnerInputQuery[],
) {
  return requests.map(({ requestId, componentPath, owner }) => {
    const selected = selectOwnerFile(snapshot, readOwners, componentPath, owner)
    if (selected.status !== "found") return { requestId, status: "missing" as const }
    return {
      requestId,
      status: "found" as const,
      input: {
        owner,
        facts: mergeOwnerFacts(selected.owners, owner),
        fields: readFields(selected.fileId).filter((entry) => sameOwner(entry.owner, owner)),
      },
    }
  })
}

function findReferences(
  snapshot: ProjectStateSnapshotView,
  readYamlFacts: ReadYamlFacts,
  queryPort: ProjectStateQueryPort,
  dependencyValidator: ProjectStateDependencyValidator,
  requests: readonly ProjectReferenceLookup[],
) {
  return requests.map((request, requestIndex) => {
    const references: ProjectReferenceLocation[] = []
    const dataChecks: {
      readonly requestId: string
      readonly componentPath: string
      readonly projectPath: string
      readonly check: ProjectStatePendingDependencyCheck
    }[] = []
    for (let fileId = 0; fileId < snapshot.fileCount; fileId += 1) {
      const componentPath = snapshot.componentPath(fileId)
      if (!isVisible(request.componentPath, componentPath)) continue
      const facts = readYamlFacts(fileId)
      if (facts === undefined) continue
      for (const pending of facts.pendingReferences) {
        if (
          pending.canonical === request.canonical ||
          (request.match === "prefix" && pending.canonical.startsWith(`${request.canonical}.`))
        ) {
          references.push({
            kind: "metadataTarget",
            projectPath: snapshot.filePath(fileId),
            componentPath,
            yamlPath: pending.yamlPath,
            canonical: pending.canonical,
          })
        }
      }
      if (request.dataPathTarget !== undefined) {
        facts.pendingChecks.forEach((check, checkIndex) => {
          dataChecks.push({
            requestId: `data-path:${requestIndex}:${fileId}:${checkIndex}`,
            componentPath,
            projectPath: snapshot.filePath(fileId),
            check,
          })
        })
      }
    }
    if (request.dataPathTarget !== undefined && dataChecks.length > 0) {
      const resolved = dependencyValidator.resolveDataPaths({
        checks: dataChecks,
        projectDir: "",
        queryPort,
      })
      const checksByRequestId = new Map(dataChecks.map((check) => [check.requestId, check]))
      for (const reference of resolved) {
        if (
          !sameOwner(reference.sourceOwner, request.dataPathTarget.owner) ||
          (request.dataPathTarget.fieldName !== undefined &&
            reference.sourceFieldName !== request.dataPathTarget.fieldName)
        ) {
          continue
        }
        const check = checksByRequestId.get(reference.requestId)
        if (check === undefined) continue
        references.push({
          kind: "dataPath",
          projectPath: reference.projectPath,
          componentPath: reference.componentPath,
          yamlPath: check.check.yamlPath,
          value: check.check.value,
          resolvedSegments: reference.resolvedSegments,
          segmentIndex: reference.resolvedSegments.length - 1,
        })
      }
    }
    return { requestId: request.requestId, references }
  })
}

function readOwnerRefPage(
  snapshot: ProjectStateSnapshotView,
  query: ProjectOwnerRefPageQuery,
  pageSize: number,
): ProjectOwnerRefPage {
  const rows: { readonly key: string; readonly owner: OwnerTypeRef }[] = []
  for (let rangeId = 0; rangeId < snapshot.ownerRangeCount && rows.length <= pageSize; rangeId += 1) {
    const range = snapshot.ownerRange(rangeId)
    const key = snapshot.stringValue(range.ownerKeyId)
    if (key <= (query.cursor ?? "")) continue
    const owner = decodeBinaryOwnerKey(key)
    if (owner.kind !== query.kind) continue
    const own = new Set<number>()
    const base = new Set<number>()
    for (let index = 0; index < range.count; index += 1) {
      const { sourceFileId } = snapshot.ownerEntry(range.start + index)
      const componentPath = snapshot.componentPath(sourceFileId)
      if (!isVisible(query.componentPath, componentPath)) continue
      ;(componentPath === query.componentPath ? own : base).add(sourceFileId)
    }
    if ((own.size > 0 ? own.size : base.size) === 1) rows.push({ key, owner })
  }
  const page = rows.slice(0, pageSize)
  return {
    refs: page.map(({ owner }) => owner),
    ...(rows.length <= pageSize ? {} : { nextCursor: page.at(-1)!.key }),
  }
}

function readComponentTargetPage(
  snapshot: ProjectStateSnapshotView,
  query: { readonly componentPath: string; readonly cursor?: string },
  pageSize: number,
): ProjectComponentTargetPage {
  const rows: {
    readonly canonical: string
    readonly sourceFileId: number
    readonly itemProjectPath?: string
    readonly ownerProjectPath?: string
  }[] = []
  for (let rangeId = 0; rangeId < snapshot.targetRangeCount && rows.length <= pageSize; rangeId += 1) {
    const range = snapshot.targetRange(rangeId)
    if (snapshot.stringValue(range.componentPathId) !== query.componentPath) continue
    const canonical = snapshot.stringValue(range.canonicalId)
    if (canonical <= (query.cursor ?? "")) continue
    const target = coalesceTargetCandidates(snapshot.lookupTarget(query.componentPath, canonical))
    if (target !== undefined) rows.push({
      canonical,
      sourceFileId: target.sourceFileId,
      ...(target.itemProjectPath === undefined ? {} : { itemProjectPath: target.itemProjectPath }),
      ...(target.ownerProjectPath === undefined ? {} : { ownerProjectPath: target.ownerProjectPath }),
    })
  }
  const page = rows.slice(0, pageSize)
  return {
    entries: page.map(({ canonical, sourceFileId, itemProjectPath, ownerProjectPath }) => ({
      logicalAddress: canonical,
      sourceProjectPath: snapshot.filePath(sourceFileId),
      ...(itemProjectPath === undefined ? {} : { itemProjectPath }),
      ...(ownerProjectPath === undefined ? {} : { ownerProjectPath }),
    })),
    ...(rows.length <= pageSize ? {} : { nextCursor: page.at(-1)!.canonical }),
  }
}

function readValidationStatus(
  snapshot: ProjectStateSnapshotView,
  typed: TypedProjectStateReader | undefined,
  query: { readonly offset: number; readonly batchSize: number },
) {
  if (!Number.isSafeInteger(query.offset) || query.offset < 0 ||
    !Number.isSafeInteger(query.batchSize) || query.batchSize < 0) {
    throw new Error("offset и batchSize должны быть неотрицательными целыми")
  }
  const end = Math.min(snapshot.fileCount, query.offset + query.batchSize)
  const rows = []
  for (let fileId = query.offset; fileId < end; fileId += 1) {
    const localValidation = typed?.localValidation(fileId) ?? snapshot.decodeDiagnostics(fileId) as
      | ProjectStateLocalValidationResult | undefined
    rows.push({
      projectPath: snapshot.filePath(fileId),
      componentPath: snapshot.componentPath(fileId),
      ...(localValidation === undefined
        ? {}
        : {
            schemaReady: !localValidation.schemaDiagnostics.some(({ severity }) => severity === "error"),
            contributedFacts: localValidation.contributedFacts,
          }),
    })
  }
  return rows
}

function createYamlFactsReader(
  snapshot: ProjectStateSnapshotView,
  typedReader: TypedProjectStateReader | undefined,
): ReadYamlFacts {
  if (typedReader !== undefined) {
    return (fileId) => typedReader.yamlFacts(fileId)
  }
  const decodedByFileId = new Map<number, DecodedYamlFacts | undefined>()
  return (fileId) => {
    if (!decodedByFileId.has(fileId)) {
      decodedByFileId.set(fileId, snapshot.decodeFacts(fileId) as DecodedYamlFacts | undefined)
    }
    return decodedByFileId.get(fileId)
  }
}

function isVisible(requestComponent: string, candidateComponent: string): boolean {
  return candidateComponent === requestComponent ||
    (requestComponent !== "cf" && candidateComponent === "cf")
}

function sameOwner(left: OwnerTypeRef, right: OwnerTypeRef): boolean {
  return left.kind === right.kind && left.name === right.name
}

function mergeOwnerFacts(
  entries: readonly ProjectStateOwnerFact[],
  owner: OwnerTypeRef,
) {
  return entries
    .filter((entry) => sameOwner(entry.owner, owner))
    .reduce((facts, entry) => ({ ...facts, ...entry.facts }), {})
}
