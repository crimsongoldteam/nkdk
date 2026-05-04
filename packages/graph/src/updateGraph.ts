import { close, connect } from "./internal/connection"
import {
  cleanupOrphanStubs,
  deleteByFiles,
  ensureFileIndexes,
  ensureLabelIndexes,
  mergeEdges,
  mergeFileLinks,
  mergeFiles,
  mergeNodes,
} from "./internal/operations"
import type { FileGraphData, GraphProgress, GraphUpdateOptions, GraphUpdatePhase } from "./types"

const reportPhase = async (
  phase: GraphUpdatePhase,
  onProgress: ((progress: GraphProgress) => void) | undefined,
  fn: () => Promise<void>,
): Promise<void> => {
  onProgress?.({ phase, done: 0, total: 1 })
  await fn()
  onProgress?.({ phase, done: 1, total: 1 })
}

/**
 * Обновляет содержимое графа по списку файлов:
 *  - удаляет узлы и рёбра, привязанные к этим файлам;
 *  - наливает новые;
 *  - узлы со входящими reference-рёбрами становятся стабами, а не удаляются;
 *  - удаляет orphan-стабы, которые после merge остались без входящих рёбер.
 */
export const updateGraph = async (
  files: readonly FileGraphData[],
  opts?: GraphUpdateOptions,
): Promise<void> => {
  const onProgress = opts?.onProgress
  const allNodes = files.flatMap((f) => f.nodes)
  const filePaths = files.map((f) => f.filePath)
  const labels = allNodes.map((n) => n.label)
  const labelByNodeId = new Map(allNodes.map((node) => [node.id, node.label]))

  const conn = await connect(opts)
  try {
    await reportPhase("ensureFileIndexes", onProgress, () => ensureFileIndexes(conn))
    await reportPhase("ensureLabelIndexes", onProgress, () => ensureLabelIndexes(conn, labels))
    await reportPhase("deleteByFiles", onProgress, () => deleteByFiles(conn, filePaths))
    await mergeFiles(conn, files, onProgress)
    await mergeNodes(conn, allNodes, onProgress)
    await mergeEdges(conn, files, labelByNodeId, onProgress)
    await mergeFileLinks(conn, files, onProgress)
    await reportPhase("cleanupOrphanStubs", onProgress, () => cleanupOrphanStubs(conn, true))
  } finally {
    await close(conn)
  }
}
