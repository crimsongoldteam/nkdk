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
  graphName: string
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
  return asExternal({ client, graph, graphName })
}

export const close = async (conn: GraphConnection): Promise<void> => {
  await asInternal(conn).client.close()
}

export const query = async (
  conn: GraphConnection,
  cypher: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, unknown>,
): Promise<unknown> => {
  // Cast params to any to bridge Record<string, unknown> → QueryParams (not exported by falkordb)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opts = params !== undefined ? { params: params as any } : undefined
  return await asInternal(conn).graph.query(cypher, opts)
}

export const ensureIndex = async (
  conn: GraphConnection,
  label: string,
  prop: string,
): Promise<void> => {
  try {
    await asInternal(conn).graph.query(`CREATE INDEX FOR (n:${label}) ON (n.${prop})`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (!/already indexed|equivalent index|index already exists/i.test(msg)) throw err
  }
}

export type RawGraphCommandArg = string | Buffer

export const graphNameOf = (conn: GraphConnection): string => asInternal(conn).graphName

export const rawCommand = async (
  conn: GraphConnection,
  args: readonly RawGraphCommandArg[],
): Promise<unknown> => {
  const client = asInternal(conn).client as unknown as {
    executeCommand?: (args: readonly RawGraphCommandArg[]) => Promise<unknown>
    sendCommand?: (args: readonly RawGraphCommandArg[]) => Promise<unknown>
  }
  if (typeof client.executeCommand === "function") return await client.executeCommand(args)
  if (typeof client.sendCommand === "function") return await client.sendCommand(args)
  throw new Error("FalkorDB client does not expose raw command execution")
}
