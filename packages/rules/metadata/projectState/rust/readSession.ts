import type { NativeProjectStateReader } from "@nkdk/project-state-native"
import type { ProjectStateDependencyValidator } from "../contracts/dependencyValidation"
import type { ProjectStateReadToken } from "../contracts"
import { createProjectStateReadSession, type ProjectStateQueryPort } from "../readSession"
import { claimBinaryProjectStateReadToken } from "../binary/readToken"
import { createBinaryProjectStateQueryPort } from "../binary/readSession"
import { ProjectStateSnapshotView } from "../binary/snapshot"
import { createTypedProjectStateReader, hasTypedProjectStateFacts } from "../binary/typedReader"
import { decodeRustTargetResponse, encodeRustTargetRequest } from "./protocol"
import { openRustProjectStateReader, projectStateSectionViews } from "./addon"

export function openRustProjectStateReadSession(
  token: ProjectStateReadToken,
  dependencyValidator: ProjectStateDependencyValidator,
) {
  const buffers = claimBinaryProjectStateReadToken(token)
  const snapshot = new ProjectStateSnapshotView(buffers)
  const fallback = createBinaryProjectStateQueryPort(snapshot, { dependencyValidator })
  const native = openRustProjectStateReader(projectStateSectionViews(buffers))
  const queryPort: ProjectStateQueryPort = {
    ...fallback,
    resolveTargets: (requests) => resolveTargets(native, snapshot, fallback, requests),
  }
  return createProjectStateReadSession({ token, queryPort, close: () => native.close() })
}

function resolveTargets(
  native: NativeProjectStateReader,
  snapshot: ProjectStateSnapshotView,
  fallback: ProjectStateQueryPort,
  requests: Parameters<ProjectStateQueryPort["resolveTargets"]>[0],
): ReturnType<ProjectStateQueryPort["resolveTargets"]> {
  if (!hasTypedProjectStateFacts(snapshot)) return fallback.resolveTargets(requests)
  const typedReader = createTypedProjectStateReader(snapshot)
  const results = decodeRustTargetResponse(native.execute(encodeRustTargetRequest(requests)))
  return results.map((result, index) => {
    const requestId = requests[index]!.requestId
    if (result.status !== "found") return { requestId, status: result.status }
    const value = result.target
    const details = typedReader.referenceDetails(value.sourceFileId, value.kind, value.canonical)
    return {
      requestId,
      status: "found" as const,
      target: {
        kind: value.kind,
        canonical: value.canonical,
        ...(details === undefined ? {} : { details }),
        ...(value.itemProjectPath === undefined || value.ownerProjectPath === undefined
          ? {}
          : { fileBacked: { itemProjectPath: value.itemProjectPath, ownerProjectPath: value.ownerProjectPath } }),
      },
      source: {
        projectPath: value.projectPath,
        componentPath: value.componentPath,
        ...(value.itemProjectPath === undefined ? {} : { itemProjectPath: value.itemProjectPath }),
        ...(value.ownerProjectPath === undefined ? {} : { ownerProjectPath: value.ownerProjectPath }),
      },
    }
  })
}
