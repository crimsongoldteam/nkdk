import { close, connect, query } from "./internal/connection"
import type { ConnectionOptions, GraphFileRecord } from "./types"

const GET_GRAPH_FILES_QUERY =
  "MATCH (f:File) RETURN f.path AS path, f.mtimeMs AS mtimeMs, f.size AS size, f.updatedAt AS updatedAt"

export const getGraphFiles = async (
  opts?: ConnectionOptions,
): Promise<GraphFileRecord[]> => {
  const conn = await connect(opts)
  try {
    const reply = await query(conn, GET_GRAPH_FILES_QUERY) as { data?: GraphFileRecord[] }
    return reply.data ?? []
  } finally {
    await close(conn)
  }
}
