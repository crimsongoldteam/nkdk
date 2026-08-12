import type { ProjectStateReadToken } from "../metadata/projectState/contracts"
import { ProjectStateSnapshotView } from "../metadata/projectState/binary/snapshot"
import { openProjectStateReadSession } from "../metadata/composition/projectState"
import type { ProjectStateQueryPattern } from "./measure-project-state-backends"

export interface BinaryProjectStateLookupTask {
  readonly readToken: ProjectStateReadToken
  readonly start: number
  readonly count: number
  readonly totalLookups: number
  readonly queryPattern: ProjectStateQueryPattern
}

export interface BinaryProjectStateLookupResult {
  readonly found: number
  readonly missing: number
  readonly rssBytes: number
}

const QUERY_BATCH_SIZE = 4_096

export default function measureBinaryProjectStateLookups(
  task: BinaryProjectStateLookupTask,
): BinaryProjectStateLookupResult {
  const snapshot = new ProjectStateSnapshotView(task.readToken.buffers)
  if (snapshot.targetRangeCount === 0 && task.totalLookups > 0) {
    throw new Error("Двоичное состояние проекта не содержит целей для измерения")
  }
  const session = openProjectStateReadSession(task.readToken)
  let found = 0
  let missing = 0

  try {
    for (let offset = 0; offset < task.count; offset += QUERY_BATCH_SIZE) {
      const length = Math.min(QUERY_BATCH_SIZE, task.count - offset)
      const requests = Array.from({ length }, (_, localIndex) =>
        createProjectStateLookupRequest(
          snapshot,
          task.start + offset + localIndex,
          task.totalLookups,
          task.queryPattern,
        ))
      for (const result of session.resolveTargets(requests)) {
        if (result.status === "missing") missing += 1
        else found += 1
      }
    }
  } finally {
    session.close()
  }

  return { found, missing, rssBytes: process.memoryUsage().rss }
}

type LookupSnapshot = Pick<
  ProjectStateSnapshotView,
  "targetRangeCount" | "targetRange" | "stringValue"
>

export function createProjectStateLookupRequest(
  snapshot: LookupSnapshot,
  queryIndex: number,
  totalLookups: number,
  queryPattern: ProjectStateQueryPattern,
) {
  const presentLookups = Math.floor(totalLookups * 0.9)
  const foundLimit = queryPattern === "repeated"
    ? presentLookups
    : Math.min(presentLookups, snapshot.targetRangeCount)
  if (queryIndex < foundLimit) {
    const range = snapshot.targetRange(queryIndex % snapshot.targetRangeCount)
    return {
      requestId: String(queryIndex),
      componentPath: snapshot.stringValue(range.componentPathId),
      canonicalTarget: snapshot.stringValue(range.canonicalId),
    }
  }
  return {
    requestId: String(queryIndex),
    componentPath: "\u0000nkdk-measure-missing",
    canonicalTarget: `\u0000nkdk-measure-missing-${queryIndex}`,
  }
}
