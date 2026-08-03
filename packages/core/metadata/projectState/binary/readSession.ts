import type { OwnerTypeRef } from "../../validation/dataPath/types"
import {
  projectStateDataPathReferenceLocation,
  resolveProjectStateDataPathReferenceBatch,
} from "../dependencyValidation"
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

type DecodedYamlFacts = Pick<
  ProjectStateYamlFileUpdate,
  "references" | "pendingReferences" | "owners" | "fields" | "forms" | "pendingChecks" | "dependencies"
>

const PAGE_SIZE = 2_000

export function createBinaryProjectStateQueryPort(
  snapshot: ProjectStateSnapshotView,
): ProjectStateQueryPort {
  const queryPort: ProjectStateQueryPort = {
    resolveTargets: (requests) => resolveTargets(snapshot, requests),
    readOwners: (requests) => requests.map((request) => readOwner(snapshot, request)),
    findReferences: (requests) => findReferences(snapshot, queryPort, requests),
    readDependencyInputs: (requests) => readDependencyInputs(snapshot, requests),
    readDependencyOwnerInputs: (requests) => readDependencyOwnerInputs(snapshot, requests),
    readOwnerRefPage: (query) => readOwnerRefPage(snapshot, query),
    readComponentTargetPage: (query) => readComponentTargetPage(snapshot, query),
    readValidationStatus: (query) => readValidationStatus(snapshot, query),
  }
  return queryPort
}

export function openBinaryProjectStateReadSession(
  token: ProjectStateReadToken,
): ProjectStateReadSession {
  const snapshot = new ProjectStateSnapshotView(claimBinaryProjectStateReadToken(token))
  const queryPort = createBinaryProjectStateQueryPort(snapshot)
  return createProjectStateReadSession({ token, queryPort })
}

function resolveTargets(
  snapshot: ProjectStateSnapshotView,
  requests: readonly ProjectTargetLookup[],
): readonly ProjectTargetLookupResult[] {
  return requests.map(({ requestId, componentPath, canonicalTarget }) => {
    const own = snapshot.lookupTarget(componentPath, canonicalTarget)
    const candidates = componentPath === "cf" || own.length > 0
      ? own
      : snapshot.lookupTarget("cf", canonicalTarget)
    if (candidates.length === 0) return { requestId, status: "missing" as const }
    if (candidates.length > 1) return { requestId, status: "ambiguous" as const }

    const candidate = candidates[0]
    const details = yamlFacts(snapshot, candidate.sourceFileId)?.references.find(
      (reference) => reference.kind === candidate.kind && reference.canonical === candidate.canonical,
    )?.details
    return {
      requestId,
      status: "found" as const,
      target: {
        kind: candidate.kind,
        canonical: candidate.canonical,
        ...(details === undefined ? {} : { details }),
      },
      source: { projectPath: candidate.projectPath, componentPath: candidate.componentPath },
    }
  })
}

function readOwner(
  snapshot: ProjectStateSnapshotView,
  request: ProjectOwnerLookup,
): ProjectOwnerLookupResult {
  const selected = selectOwnerFile(snapshot, request.componentPath, request.owner)
  if (selected.status !== "found") return { requestId: request.requestId, status: selected.status }
  return {
    requestId: request.requestId,
    status: "found",
    facts: mergeOwnerFacts(selected.facts.owners, request.owner),
  }
}

function selectOwnerFile(
  snapshot: ProjectStateSnapshotView,
  componentPath: string,
  owner: OwnerTypeRef,
):
  | { readonly status: "missing" | "ambiguous" }
  | { readonly status: "found"; readonly fileId: number; readonly facts: DecodedYamlFacts } {
  const own: { fileId: number; facts: DecodedYamlFacts }[] = []
  const base: { fileId: number; facts: DecodedYamlFacts }[] = []
  const seen = new Set<number>()
  for (const { sourceFileId: fileId } of snapshot.lookupOwnerKey(encodeBinaryOwnerKey(owner))) {
    if (seen.has(fileId)) continue
    seen.add(fileId)
    const candidateComponent = snapshot.componentPath(fileId)
    if (!isVisible(componentPath, candidateComponent)) continue
    const facts = yamlFacts(snapshot, fileId)
    if (facts === undefined || !facts.owners.some((entry) => sameOwner(entry.owner, owner))) continue
    ;(candidateComponent === componentPath ? own : base).push({ fileId, facts })
  }
  const candidates = own.length > 0 ? own : base
  if (candidates.length === 0) return { status: "missing" }
  if (candidates.length > 1) return { status: "ambiguous" }
  return { status: "found", ...candidates[0] }
}

function readDependencyInputs(
  snapshot: ProjectStateSnapshotView,
  requests: readonly ProjectDependencyInputQuery[],
) {
  return requests.map(({ requestId, componentPath, projectPath, check }) => {
    const selected = selectOwnerFile(snapshot, componentPath, check.owner)
    if (selected.status !== "found") return { requestId, status: "missing" as const }
    const formFileId = snapshot.findFile(projectPath)
    const input: ProjectDependencyInput = {
      owners: selected.facts.owners
        .filter(({ owner }) => sameOwner(owner, check.owner))
        .map(({ owner, facts }) => ({ owner, facts })),
      fields: selected.facts.fields.filter(({ owner }) => sameOwner(owner, check.owner)),
      forms: formFileId === undefined ? [] : yamlFacts(snapshot, formFileId)?.forms ?? [],
    }
    return { requestId, status: "found" as const, input }
  })
}

function readDependencyOwnerInputs(
  snapshot: ProjectStateSnapshotView,
  requests: readonly ProjectDependencyOwnerInputQuery[],
) {
  return requests.map(({ requestId, componentPath, owner }) => {
    const selected = selectOwnerFile(snapshot, componentPath, owner)
    if (selected.status !== "found") return { requestId, status: "missing" as const }
    return {
      requestId,
      status: "found" as const,
      input: {
        owner,
        facts: mergeOwnerFacts(selected.facts.owners, owner),
        fields: selected.facts.fields.filter((entry) => sameOwner(entry.owner, owner)),
      },
    }
  })
}

function findReferences(
  snapshot: ProjectStateSnapshotView,
  queryPort: ProjectStateQueryPort,
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
      const facts = yamlFacts(snapshot, fileId)
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
      const resolved = resolveProjectStateDataPathReferenceBatch({
        checks: dataChecks,
        projectDir: "",
        queryPort,
      })
      for (const reference of resolved) {
        if (
          reference.target.source.kind !== "objectField" ||
          !sameOwner(reference.target.source.owner, request.dataPathTarget.owner) ||
          (request.dataPathTarget.fieldName !== undefined &&
            reference.target.source.name !== request.dataPathTarget.fieldName)
        ) {
          continue
        }
        references.push(projectStateDataPathReferenceLocation(reference))
      }
    }
    return { requestId: request.requestId, references }
  })
}

function readOwnerRefPage(
  snapshot: ProjectStateSnapshotView,
  query: ProjectOwnerRefPageQuery,
): ProjectOwnerRefPage {
  const rows: { readonly key: string; readonly owner: OwnerTypeRef }[] = []
  for (let rangeId = 0; rangeId < snapshot.ownerRangeCount && rows.length <= PAGE_SIZE; rangeId += 1) {
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
  const page = rows.slice(0, PAGE_SIZE)
  return {
    refs: page.map(({ owner }) => owner),
    ...(rows.length <= PAGE_SIZE ? {} : { nextCursor: page.at(-1)!.key }),
  }
}

function readComponentTargetPage(
  snapshot: ProjectStateSnapshotView,
  query: { readonly componentPath: string; readonly cursor?: string },
): ProjectComponentTargetPage {
  const rows: { readonly canonical: string; readonly sourceFileId: number }[] = []
  for (let rangeId = 0; rangeId < snapshot.targetRangeCount && rows.length <= PAGE_SIZE; rangeId += 1) {
    const range = snapshot.targetRange(rangeId)
    if (snapshot.stringValue(range.componentPathId) !== query.componentPath) continue
    const canonical = snapshot.stringValue(range.canonicalId)
    if (canonical <= (query.cursor ?? "")) continue
    const files = new Set<number>()
    for (let index = 0; index < range.count; index += 1) {
      files.add(snapshot.targetEntry(range.start + index).sourceFileId)
    }
    if (files.size === 1) rows.push({ canonical, sourceFileId: files.values().next().value! })
  }
  const page = rows.slice(0, PAGE_SIZE)
  return {
    entries: page.map(({ canonical, sourceFileId }) => ({
      logicalAddress: canonical,
      sourceProjectPath: snapshot.filePath(sourceFileId),
    })),
    ...(rows.length <= PAGE_SIZE ? {} : { nextCursor: page.at(-1)!.canonical }),
  }
}

function readValidationStatus(
  snapshot: ProjectStateSnapshotView,
  query: { readonly offset: number; readonly batchSize: number },
) {
  if (!Number.isSafeInteger(query.offset) || query.offset < 0 ||
    !Number.isSafeInteger(query.batchSize) || query.batchSize < 0) {
    throw new Error("offset и batchSize должны быть неотрицательными целыми")
  }
  const end = Math.min(snapshot.fileCount, query.offset + query.batchSize)
  const rows = []
  for (let fileId = query.offset; fileId < end; fileId += 1) {
    const localValidation = snapshot.decodeDiagnostics(fileId) as
      | ProjectStateLocalValidationResult
      | undefined
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

function yamlFacts(snapshot: ProjectStateSnapshotView, fileId: number): DecodedYamlFacts | undefined {
  return snapshot.decodeFacts(fileId) as DecodedYamlFacts | undefined
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
