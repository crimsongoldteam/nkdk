import { close, connect } from "./internal/connection"
import {
  cleanupOrphanStubs,
  deleteByFilePaths,
  ensureLabelIndexes,
  mergeEdges,
  mergeNodes,
} from "./internal/operations"
import type { ConnectionOptions, FileGraphData } from "./types"

/**
 * Обновляет содержимое графа по списку файлов:
 *  - удаляет узлы и рёбра, привязанные к этим файлам;
 *  - наливает новые;
 *  - узлы со входящими reference-рёбрами становятся стабами, а не удаляются;
 *  - удаляет orphan-стабы, которые после merge остались без входящих рёбер.
 */
export const updateGraph = async (
  files: readonly FileGraphData[],
  opts?: ConnectionOptions,
): Promise<void> => {
  const allNodes = files.flatMap((f) => f.nodes)
  const allEdges = files.flatMap((f) => f.edges)
  const filePaths = files.map((f) => f.filePath)
  const labels = allNodes.map((n) => n.label)
  const labelByNodeId = new Map(allNodes.map((node) => [node.id, node.label]))

  const conn = await connect(opts)
  try {
    await ensureLabelIndexes(conn, labels)
    await deleteByFilePaths(conn, filePaths)
    await mergeNodes(conn, allNodes)
    await mergeEdges(conn, allEdges, labelByNodeId)
    await cleanupOrphanStubs(conn)
  } finally {
    await close(conn)
  }
}
