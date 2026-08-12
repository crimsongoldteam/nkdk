import type { NativeProjectStateReader } from "@nkdk/project-state-native"
import type { ProjectStateDependencyValidator } from "../contracts/dependencyValidation"
import type { ProjectStateReadToken } from "../contracts"
import {
  createProjectStateReadSession,
  type ProjectStateQueryPort,
  type ProjectTargetLookupResult,
} from "../readSession"
import { claimBinaryProjectStateReadToken } from "../binary/readToken"
import { createBinaryProjectStateQueryPort } from "../binary/readSession"
import { ProjectStateSnapshotView } from "../binary/snapshot"
import {
  createTypedProjectStateReader,
  hasTypedProjectStateFacts,
  type TypedProjectStateReader,
} from "../binary/typedReader"
import { decodeRustTargetResponse, encodeRustTargetRequest } from "./protocol"
import { openRustProjectStateReader, projectStateSectionViews } from "./addon"

export function openRustProjectStateReadSession(
  token: ProjectStateReadToken,
  dependencyValidator: ProjectStateDependencyValidator,
  dependencies: Partial<RustReadSessionDependencies> = {},
) {
  const buffers = claimBinaryProjectStateReadToken(token)
  const snapshot = new ProjectStateSnapshotView(buffers)
  const typedReader = hasTypedProjectStateFacts(snapshot)
    ? (dependencies.createTypedReader ?? createTypedProjectStateReader)(snapshot)
    : undefined
  const native = (dependencies.openReader ?? openRustProjectStateReader)(projectStateSectionViews(buffers))
  const queryPort = createRustProjectStateQueryPort({ native, snapshot, typedReader, dependencyValidator }, dependencies)
  return createProjectStateReadSession({ token, queryPort, close: () => native.close() })
}

export function createRustProjectStateQueryPort(
  params: {
    readonly native: Pick<NativeProjectStateReader, "execute">
    readonly snapshot: ProjectStateSnapshotView
    readonly typedReader?: TypedProjectStateReader
    readonly dependencyValidator: ProjectStateDependencyValidator
  },
  dependencies: Pick<Partial<RustReadSessionDependencies>, "createFallbackQueryPort" | "createTargetCacheKey"> = {},
): ProjectStateQueryPort {
  const fallback = (dependencies.createFallbackQueryPort ?? createBinaryProjectStateQueryPort)(
    params.snapshot,
    { dependencyValidator: params.dependencyValidator, typedReader: params.typedReader },
  )
  const createTargetCacheKey = dependencies.createTargetCacheKey ?? targetCacheKey
  const targetCache = new Map<string, CachedTargetLookupResult>()
  return {
    ...fallback,
    resolveTargets: (requests) => resolveTargets(
      params.native,
      params.snapshot,
      params.typedReader,
      fallback,
      targetCache,
      createTargetCacheKey,
      requests,
    ),
  }
}

interface RustReadSessionDependencies {
  readonly openReader: (
    sections: Parameters<typeof openRustProjectStateReader>[0],
  ) => Pick<NativeProjectStateReader, "execute" | "close">
  readonly createTypedReader: typeof createTypedProjectStateReader
  readonly createFallbackQueryPort: typeof createBinaryProjectStateQueryPort
  readonly createTargetCacheKey: typeof targetCacheKey
}

type WithoutRequestId<T> = T extends unknown ? Omit<T, "requestId"> : never
type CachedTargetLookupResult = WithoutRequestId<ProjectTargetLookupResult>

function resolveTargets(
  native: Pick<NativeProjectStateReader, "execute">,
  snapshot: ProjectStateSnapshotView,
  typedReader: TypedProjectStateReader | undefined,
  fallback: ProjectStateQueryPort,
  cache: Map<string, CachedTargetLookupResult>,
  createTargetCacheKey: typeof targetCacheKey,
  requests: Parameters<ProjectStateQueryPort["resolveTargets"]>[0],
): ReturnType<ProjectStateQueryPort["resolveTargets"]> {
  if (typedReader === undefined) return fallback.resolveTargets(requests)
  const keys = requests.map(({ componentPath, canonicalTarget }) =>
    createTargetCacheKey(componentPath, canonicalTarget))
  const pending = new Map<string, (typeof requests)[number]>()
  requests.forEach((request, index) => {
    const key = keys[index]!
    if (!cache.has(key)) pending.set(key, request)
  })
  if (pending.size > 0) {
    const entries = [...pending]
    const results = decodeRustTargetResponse(native.execute(encodeRustTargetRequest(
      entries.map(([, request]) => request),
    )))
    results.forEach((result, index) => {
      cache.set(entries[index]![0], decodeTarget(snapshot, typedReader, result))
    })
  }
  return requests.map(({ requestId }, index) => ({
    requestId,
    ...cache.get(keys[index]!)!,
  }))
}

function decodeTarget(
  snapshot: ProjectStateSnapshotView,
  typedReader: TypedProjectStateReader,
  result: ReturnType<typeof decodeRustTargetResponse>[number],
): CachedTargetLookupResult {
  if (result.status !== "found") return { status: result.status }
  const value = result.target
  const canonical = snapshot.stringValue(value.canonicalId)
  const componentPath = snapshot.stringValue(value.componentPathId)
  const projectPath = snapshot.filePath(value.sourceFileId)
  const itemProjectPath = value.itemProjectPathId === undefined
    ? undefined
    : snapshot.stringValue(value.itemProjectPathId)
  const ownerProjectPath = value.ownerProjectPathId === undefined
    ? undefined
    : snapshot.stringValue(value.ownerProjectPathId)
  const details = typedReader.referenceDetails(value.sourceFileId, value.kind, canonical)
  return {
    status: "found",
    target: {
      kind: value.kind,
      canonical,
      ...(details === undefined ? {} : { details }),
      ...(itemProjectPath === undefined || ownerProjectPath === undefined
        ? {}
        : { fileBacked: { itemProjectPath, ownerProjectPath } }),
    },
    source: {
      projectPath,
      componentPath,
      ...(itemProjectPath === undefined ? {} : { itemProjectPath }),
      ...(ownerProjectPath === undefined ? {} : { ownerProjectPath }),
    },
  }
}

function targetCacheKey(componentPath: string, canonicalTarget: string): string {
  return `${componentPath}\u0000${canonicalTarget}`
}
