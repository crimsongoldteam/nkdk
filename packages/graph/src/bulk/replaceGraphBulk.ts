import { query } from "../internal/connection"
import type { GraphConnection } from "../internal/connection"
import { ensureFileIndexes, ensureLabelIndexes, resetGraph, validateReplacePayload } from "../internal/operations"
import type { FileGraphData, GraphProgress } from "../types"
import { encodeEdgeBlobs, encodeNodeBlobs } from "./encoder"
import { createBulkPlan } from "./plan"
import { buildBulkCommands, writeBulkCommands } from "./write"

interface BulkReplaceOptions {
  maxBlobBytes?: number
  maxCommandBytes?: number
  onProgress?: (progress: GraphProgress) => void
}

const report = async (
  phase: GraphProgress["phase"],
  onProgress: ((progress: GraphProgress) => void) | undefined,
  fn: () => Promise<void>,
): Promise<void> => {
  onProgress?.({ phase, done: 0, total: 1 })
  await fn()
  onProgress?.({ phase, done: 1, total: 1 })
}

export const replaceGraphBulk = async (
  conn: GraphConnection,
  files: readonly FileGraphData[],
  opts: BulkReplaceOptions = {},
): Promise<void> => {
  validateReplacePayload(files)
  await report("resetGraph", opts.onProgress, () => resetGraph(conn))

  const plan = await (async () => {
    let created = createBulkPlan(files)
    await report("bulkPlan", opts.onProgress, async () => {
      created = createBulkPlan(files)
    })
    return created
  })()

  const nodeBlobs = plan.nodeGroups.flatMap((group) =>
    encodeNodeBlobs(group.label, group.nodes).map((blob) => ({ kind: "node" as const, ...blob })),
  )
  const edgeBlobs = plan.edgeGroups.flatMap((group) =>
    encodeEdgeBlobs(group.kind, group.edges).map((blob) => ({ kind: "edge" as const, ...blob })),
  )
  const commands = buildBulkCommands([...nodeBlobs, ...edgeBlobs], {
    maxBlobBytes: opts.maxBlobBytes,
    maxCommandBytes: opts.maxCommandBytes,
  })

  await report("bulkWrite", opts.onProgress, async () => {
    await writeBulkCommands(conn, commands)
    await query(conn, "MATCH (n) WHERE n.id IS NOT NULL AND NOT n:File SET n:GraphNode")
  })
  await report("ensureFileIndexes", opts.onProgress, () => ensureFileIndexes(conn))
  await report("ensureLabelIndexes", opts.onProgress, () => ensureLabelIndexes(conn, plan.labels))
}
