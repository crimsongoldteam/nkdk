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
  GraphPrimitive,
  NodeData,
} from "./types"

export { updateGraph } from "./updateGraph"
export { withGraph, type GraphSession } from "./withGraph"
