import { FalkorDB } from "falkordb"

const DEFAULT_URL = "redis://localhost:6379"
const DEFAULT_GRAPH_NAME = "nakidka"

export interface GraphOptions {
  url?: string
  graphName?: string
}

declare const graphConnectionBrand: unique symbol
export type GraphConnection = { readonly [graphConnectionBrand]: true }

type InternalGraphConnection = {
  client: Awaited<ReturnType<typeof FalkorDB.connect>>
  graph: ReturnType<Awaited<ReturnType<typeof FalkorDB.connect>>["selectGraph"]>
}

const asInternal = (conn: GraphConnection): InternalGraphConnection =>
  conn as unknown as InternalGraphConnection

const asExternal = (conn: InternalGraphConnection): GraphConnection =>
  conn as unknown as GraphConnection

export const connect = async (opts?: GraphOptions): Promise<GraphConnection> => {
  const url = opts?.url ?? process.env["NKDK_GRAPH_URL"] ?? DEFAULT_URL
  const graphName = opts?.graphName ?? process.env["NKDK_GRAPH_NAME"] ?? DEFAULT_GRAPH_NAME
  const client = await FalkorDB.connect({ url })
  const graph = client.selectGraph(graphName)
  return asExternal({ client, graph })
}

export const close = async (conn: GraphConnection): Promise<void> => {
  await asInternal(conn).client.close()
}

export const resetGraph = async (conn: GraphConnection): Promise<void> => {
  try {
    await asInternal(conn).graph.delete()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (!/no such|does not exist|empty key/i.test(msg)) throw err
  }
}

export const addCatalogs = async (
  conn: GraphConnection,
  names: readonly string[],
): Promise<void> => {
  if (names.length === 0) return
  await asInternal(conn).graph.query("UNWIND $batch AS n CREATE (:Catalog {name: n})", {
    params: { batch: [...names] },
  })
}
