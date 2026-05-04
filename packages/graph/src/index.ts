export {
  close,
  connect,
  ensureIndex,
  query,
  type GraphConnection,
  type GraphOptions,
} from "./internal/connection"

export type {
  ConnectionOptions,
  EdgeData,
  FileGraphData,
  FileStats,
  GraphFileRecord,
  GraphProgress,
  GraphPrimitive,
  GraphUpdateOptions,
  GraphUpdatePhase,
  NodeData,
} from "./types"

export { updateGraph } from "./updateGraph"
export { getGraphFiles } from "./getGraphFiles"
export { withGraph, type GraphSession } from "./withGraph"
