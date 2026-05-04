import { ensureIndex, query } from "./connection"
import type { GraphConnection } from "./connection"
import type { EdgeData, NodeData } from "../types"

export const BATCH_SIZE = 500

type CypherPrimitive = string | number | boolean | null
type CypherValue = CypherPrimitive | CypherPrimitive[]

const groupBy = <T, K extends string>(
  items: readonly T[],
  key: (item: T) => K,
): Map<K, T[]> => {
  const result = new Map<K, T[]>()
  for (const item of items) {
    const k = key(item)
    const bucket = result.get(k)
    if (bucket === undefined) result.set(k, [item])
    else bucket.push(item)
  }
  return result
}

const escapeCypherString = (value: string): string =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")

const cypherString = (value: string): string => `"${escapeCypherString(value)}"`

const cypherPropertyKey = (key: string): string => `\`${key.replace(/`/g, "``")}\``

const cypherValue = (value: CypherValue): string => {
  if (Array.isArray(value)) return `[${value.map(cypherValue).join(",")}]`
  if (value === null) return "null"
  if (typeof value === "string") return cypherString(value)
  return String(value)
}

const cypherProps = (props: Record<string, CypherValue>): string =>
  `{${Object.entries(props)
    .map(([key, value]) => `${cypherPropertyKey(key)}:${cypherValue(value)}`)
    .join(",")}}`

const cypherNodeBatch = (nodes: readonly { id: string; props: NodeData["props"] }[]): string =>
  `[${nodes
    .map((node) => `{id:${cypherString(node.id)},props:${cypherProps(node.props)}}`)
    .join(",")}]`

const cypherEdgeBatch = (
  edges: readonly { src: string; tgt: string; props: NonNullable<EdgeData["props"]> }[],
): string =>
  `[${edges
    .map(
      (edge) =>
        `{src:${cypherString(edge.src)},tgt:${cypherString(edge.tgt)},props:${cypherProps(edge.props)}}`,
    )
    .join(",")}]`

const sendBatches = async <T>(
  conn: GraphConnection,
  items: readonly T[],
  buildCypher: (batch: readonly T[]) => string,
): Promise<void> => {
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    await query(conn, buildCypher(items.slice(i, i + BATCH_SIZE)))
  }
}

export const mergeNodes = async (
  conn: GraphConnection,
  nodes: readonly NodeData[],
): Promise<void> => {
  if (nodes.length === 0) return
  const byLabel = groupBy(nodes, (n) => n.label)
  for (const [label, group] of byLabel) {
    const payload = group.map((n) => ({ id: n.id, props: n.props }))
    await sendBatches(
      conn,
      payload,
      (batch) =>
        `UNWIND ${cypherNodeBatch(batch)} AS n MERGE (m:${label} {id: n.id}) SET m += n.props`,
    )
  }
}

export const mergeEdges = async (
  conn: GraphConnection,
  edges: readonly EdgeData[],
): Promise<void> => {
  if (edges.length === 0) return
  const byKind = groupBy(edges, (e) => e.kind)
  for (const [kind, group] of byKind) {
    const payload = group.map((e) => ({ src: e.src, tgt: e.tgt, props: e.props ?? {} }))
    await sendBatches(
      conn,
      payload,
      (batch) =>
        `UNWIND ${cypherEdgeBatch(batch)} AS e MATCH (s {id: e.src}), (t {id: e.tgt}) MERGE (s)-[r:${kind}]->(t) SET r = e.props`,
    )
  }
}

export const deleteByFilePaths = async (
  conn: GraphConnection,
  filePaths: readonly string[],
): Promise<void> => {
  if (filePaths.length === 0) return
  const params = { filePaths: [...filePaths] }
  await query(
    conn,
    "MATCH (n) WHERE n.filePath IN $filePaths MATCH (n)-[r]->() DELETE r",
    params,
  )
  await query(
    conn,
    "MATCH (n) WHERE n.filePath IN $filePaths AND ()-->(n) SET n = {id: n.id}",
    params,
  )
  await query(
    conn,
    "MATCH (n) WHERE n.filePath IN $filePaths AND NOT ()-->(n) DETACH DELETE n",
    params,
  )
}

export const cleanupOrphanStubs = async (conn: GraphConnection): Promise<void> => {
  await query(
    conn,
    "MATCH (n) WHERE n.filePath IS NULL AND NOT ()-->(n) DETACH DELETE n",
  )
}

export const ensureLabelIndexes = async (
  conn: GraphConnection,
  labels: readonly string[],
): Promise<void> => {
  const unique = new Set(labels)
  for (const label of unique) {
    await ensureIndex(conn, label, "id")
  }
}
