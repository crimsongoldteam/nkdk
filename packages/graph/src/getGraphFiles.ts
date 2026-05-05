import { close, connect, query } from "./internal/connection"
import type { ConnectionOptions, GraphFileRecord } from "./types"

const PAGE_SIZE = 5000
const GET_GRAPH_FILES_QUERY =
  "MATCH (f:File) RETURN f.path AS path, f.mtimeMs AS mtimeMs, f.size AS size, f.updatedAt AS updatedAt ORDER BY path SKIP $skip LIMIT $limit"

export const getGraphFiles = async (
  opts?: ConnectionOptions,
): Promise<GraphFileRecord[]> => {
  const conn = await connect(opts)
  try {
    const result: GraphFileRecord[] = []
    for (let skip = 0; ; skip += PAGE_SIZE) {
      const reply = await query(conn, GET_GRAPH_FILES_QUERY, { skip, limit: PAGE_SIZE }) as { data?: GraphFileRecord[] }
      const page = reply.data ?? []
      result.push(...page)
      if (page.length < PAGE_SIZE) return result
    }
  } finally {
    await close(conn)
  }
}
