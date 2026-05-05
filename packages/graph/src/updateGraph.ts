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
  resetGraph,
} from "./internal/operations"
import type { FileGraphData, GraphProgress, GraphUpdateOptions, GraphUpdatePhase } from "./types"

const isDeletionTombstone = (file: FileGraphData): boolean =>
  file.fileStats === undefined &&
  file.nodes.length === 0 &&
  file.edges.length === 0 &&
  (file.declaredNodeIds?.length ?? 0) === 0 &&
  (file.contributedNodeIds?.length ?? 0) === 0

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
  const filesToMerge = files.filter((file) => !isDeletionTombstone(file))
  const allNodes = filesToMerge.flatMap((f) => f.nodes)
  const filePaths = files.map((f) => f.filePath)
  const labels = allNodes.map((n) => n.label)
  const labelByNodeId = new Map(allNodes.map((node) => [node.id, node.label]))

  const conn = await connect(opts)
  try {
    if (files.length === 0) {
      await reportPhase("resetGraph", onProgress, () => resetGraph(conn))
      return
    }

    await reportPhase("ensureFileIndexes", onProgress, () => ensureFileIndexes(conn))
    await reportPhase("ensureLabelIndexes", onProgress, () => ensureLabelIndexes(conn, labels))
    await reportPhase("deleteByFiles", onProgress, () => deleteByFiles(conn, filePaths))
    await mergeFiles(conn, filesToMerge, onProgress)
    await mergeNodes(conn, allNodes, onProgress)
    await mergeEdges(conn, filesToMerge, labelByNodeId, onProgress)
    await mergeFileLinks(conn, filesToMerge, onProgress)
    await reportPhase("cleanupOrphanStubs", onProgress, () => cleanupOrphanStubs(conn, true))
  } finally {
    await close(conn)
  }
}
