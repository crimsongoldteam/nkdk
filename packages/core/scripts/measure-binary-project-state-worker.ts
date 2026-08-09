import type { ProjectStateReadToken } from "../metadata/projectState/contracts"
import { openBinaryProjectStateReadSession } from "../metadata/projectState/binary/readSession"
import { ProjectStateSnapshotView } from "../metadata/projectState/binary/snapshot"
import { createProjectStateDependencyValidator } from "../metadata/validation/projectStateDependencyValidation"

export interface BinaryProjectStateLookupTask {
  readonly readToken: ProjectStateReadToken
  readonly start: number
  readonly count: number
  readonly totalLookups: number
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
  const session = openBinaryProjectStateReadSession(task.readToken, createProjectStateDependencyValidator())
  const presentLookups = Math.floor(task.totalLookups * 0.9)
  let found = 0
  let missing = 0

  try {
    for (let offset = 0; offset < task.count; offset += QUERY_BATCH_SIZE) {
      const length = Math.min(QUERY_BATCH_SIZE, task.count - offset)
      const requests = Array.from({ length }, (_, localIndex) => {
        const queryIndex = task.start + offset + localIndex
        if (queryIndex < presentLookups) {
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
      })
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
