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
  GraphPrimitive,
  NodeData,
} from "./types"

export { updateGraph } from "./updateGraph"
