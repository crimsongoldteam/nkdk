import { deleteGraph } from "../internal/connection"
import type { GraphConnection } from "../internal/connection"
import { ensureFileIndexes, ensureLabelIndexes, validateReplacePayload } from "../internal/operations"
import type { FileGraphData, GraphProgress } from "../types"
import { createBulkPlan } from "./plan"
import { buildBulkTokenCommands } from "./stream"
import { writeBulkCommands } from "./write"

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
  await report("resetGraph", opts.onProgress, () => deleteGraph(conn))

  const plan = await (async () => {
    let created = createBulkPlan(files)
    await report("bulkPlan", opts.onProgress, async () => {
      created = createBulkPlan(files)
    })
    return created
  })()

  const { commands, stats } = buildBulkTokenCommands({
    nodeGroups: plan.nodeGroups,
    edgeGroups: plan.edgeGroups,
  }, {
    maxTokenBytes: opts.maxBlobBytes,
    maxCommandBytes: opts.maxCommandBytes,
  })

  if (process.env["DEBUG"]) {
    console.log(`bulkCommands      ${stats.commands}`)
    console.log(`bulkNodeBlobs     ${stats.nodeBlobs}`)
    console.log(`bulkEdgeBlobs     ${stats.edgeBlobs}`)
    console.log(`bulkBytes         ${stats.totalBytes}`)
  }

  await report("bulkWrite", opts.onProgress, async () => {
    await writeBulkCommands(conn, commands)
  })
  await report("ensureFileIndexes", opts.onProgress, () => ensureFileIndexes(conn))
  await report("ensureLabelIndexes", opts.onProgress, () => ensureLabelIndexes(conn, plan.labels))
}
