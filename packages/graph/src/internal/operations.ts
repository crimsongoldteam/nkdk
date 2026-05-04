import { ensureIndex, query } from "./connection"
import type { GraphConnection } from "./connection"
import type { EdgeData, FileGraphData, FileStats, NodeData } from "../types"

export const BATCH_SIZE = 500

type CypherPrimitive = string | number | boolean | null
type CypherValue = CypherPrimitive | CypherPrimitive[]
type FalkorPropertyValue = Exclude<CypherPrimitive, null> | Exclude<CypherPrimitive, null>[]

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

const cypherLabel = (label: string | undefined): string =>
  label === undefined ? "" : `:${label}`

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

const sanitizeProps = (props: Record<string, CypherValue>): Record<string, FalkorPropertyValue> => {
  const result: Record<string, FalkorPropertyValue> = {}
  for (const [key, value] of Object.entries(props)) {
    if (value === null) continue
    if (Array.isArray(value)) {
      const values = value.filter((item): item is Exclude<CypherPrimitive, null> => item !== null)
      if (values.length > 0) result[key] = values
      continue
    }
    result[key] = value
  }
  return result
}

const cypherNodeBatch = (nodes: readonly { id: string; props: NodeData["props"] }[]): string =>
  `[${nodes
    .map((node) => `{id:${cypherString(node.id)},props:${cypherProps(sanitizeProps(node.props))}}`)
    .join(",")}]`

const cypherEdgeBatch = (
  edges: readonly { src: string; tgt: string; filePath: string; props: NonNullable<EdgeData["props"]> }[],
): string =>
  `[${edges
    .map(
      (edge) =>
        `{src:${cypherString(edge.src)},tgt:${cypherString(edge.tgt)},filePath:${cypherString(edge.filePath)},props:${cypherProps(sanitizeProps(edge.props))}}`,
    )
    .join(",")}]`

const cypherLegacyEdgeBatch = (
  edges: readonly { src: string; tgt: string; props: NonNullable<EdgeData["props"]> }[],
): string =>
  `[${edges
    .map(
      (edge) =>
        `{src:${cypherString(edge.src)},tgt:${cypherString(edge.tgt)},props:${cypherProps(sanitizeProps(edge.props))}}`,
    )
    .join(",")}]`

const nowStats = (): FileStats => ({
  mtimeMs: 0,
  size: 0,
  updatedAt: Date.now(),
})

const filePayload = (file: FileGraphData): { path: string; stats: FileStats } => ({
  path: file.filePath,
  stats: file.fileStats ?? nowStats(),
})

const cypherFileBatch = (files: readonly { path: string; stats: FileStats }[]): string =>
  `[${files
    .map(
      (file) =>
        `{path:${cypherString(file.path)},mtimeMs:${file.stats.mtimeMs},size:${file.stats.size},updatedAt:${file.stats.updatedAt}}`,
    )
    .join(",")}]`

const cypherLinkBatch = (links: readonly { filePath: string; nodeId: string }[]): string =>
  `[${links
    .map((link) => `{filePath:${cypherString(link.filePath)},nodeId:${cypherString(link.nodeId)}}`)
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
  files: readonly FileGraphData[] | readonly EdgeData[],
  labelByNodeId?: ReadonlyMap<string, string>,
): Promise<void> => {
  if (files.length > 0 && !("filePath" in files[0])) {
    await mergeLegacyEdges(conn, files as readonly EdgeData[], labelByNodeId)
    return
  }
  const graphFiles = files as readonly FileGraphData[]
  const edges = graphFiles.flatMap((file) =>
    file.edges.map((edge) => ({ ...edge, filePath: file.filePath })),
  )
  if (edges.length === 0) return
  const byKindAndLabels = groupBy(
    edges,
    (e) =>
      `${e.kind}\u0000${labelByNodeId?.get(e.src) ?? ""}\u0000${labelByNodeId?.get(e.tgt) ?? ""}`,
  )
  for (const [groupKey, group] of byKindAndLabels) {
    const [kind, srcLabel, tgtLabel] = groupKey.split("\u0000") as [string, string, string]
    const payload = group.map((e) => ({
      src: e.src,
      tgt: e.tgt,
      filePath: e.filePath,
      props: e.props ?? {},
    }))
    await sendBatches(
      conn,
      payload,
      (batch) =>
        `UNWIND ${cypherEdgeBatch(batch)} AS e MATCH (s${cypherLabel(srcLabel || undefined)} {id: e.src}), (t${cypherLabel(tgtLabel || undefined)} {id: e.tgt}) MERGE (s)-[r:${kind}]->(t) SET r = e.props SET r.filePath = e.filePath`,
    )
  }
}

export const mergeLegacyEdges = async (
  conn: GraphConnection,
  edges: readonly EdgeData[],
  labelByNodeId?: ReadonlyMap<string, string>,
): Promise<void> => {
  if (edges.length === 0) return
  const byKindAndLabels = groupBy(
    edges,
    (e) =>
      `${e.kind}\u0000${labelByNodeId?.get(e.src) ?? ""}\u0000${labelByNodeId?.get(e.tgt) ?? ""}`,
  )
  for (const [groupKey, group] of byKindAndLabels) {
    const [kind, srcLabel, tgtLabel] = groupKey.split("\u0000") as [string, string, string]
    const payload = group.map((e) => ({ src: e.src, tgt: e.tgt, props: e.props ?? {} }))
    await sendBatches(
      conn,
      payload,
      (batch) =>
        `UNWIND ${cypherLegacyEdgeBatch(batch)} AS e MATCH (s${cypherLabel(srcLabel || undefined)} {id: e.src}), (t${cypherLabel(tgtLabel || undefined)} {id: e.tgt}) MERGE (s)-[r:${kind}]->(t) SET r = e.props`,
    )
  }
}

export const ensureFileIndexes = async (conn: GraphConnection): Promise<void> => {
  await ensureIndex(conn, "File", "path")
}

export const deleteByFiles = async (
  conn: GraphConnection,
  filePaths: readonly string[],
): Promise<void> => {
  if (filePaths.length === 0) return
  const params = { filePaths: [...filePaths] }

  await query(
    conn,
    [
      "MATCH (f:File) WHERE f.path IN $filePaths",
      "OPTIONAL MATCH (f)-[:DECLARES]->(n)",
      "WITH f, collect(n) AS oldNodes",
      "OPTIONAL MATCH (f)-[oldRel:DECLARES|CONTRIBUTES]->()",
      "DELETE oldRel",
      "WITH f, oldNodes",
      "UNWIND oldNodes AS n",
      "OPTIONAL MATCH (:File)-[:DECLARES]->(n)",
      "WITH f, n, count(*) AS owners",
      "OPTIONAL MATCH ()-[r]->(n)",
      "WHERE type(r) <> 'DECLARES' AND type(r) <> 'CONTRIBUTES'",
      "WITH f, n, owners, count(r) AS subjectIncoming",
      "OPTIONAL MATCH (n)-[out]->()",
      "WHERE type(out) <> 'DECLARES' AND type(out) <> 'CONTRIBUTES'",
      "DELETE out",
      "WITH f, n, owners, subjectIncoming",
      "FOREACH (_ IN CASE WHEN owners = 0 AND subjectIncoming > 0 THEN [1] ELSE [] END | SET n = {id: n.id})",
      "FOREACH (_ IN CASE WHEN owners = 0 AND subjectIncoming = 0 THEN [1] ELSE [] END | DETACH DELETE n)",
      "WITH DISTINCT f",
      "DETACH DELETE f",
    ].join(" "),
    params,
  )

  await query(
    conn,
    "MATCH ()-[r]->() WHERE r.filePath IN $filePaths DELETE r",
    params,
  )
  await query(
    conn,
    "MATCH (f:File) WHERE f.path IN $filePaths DETACH DELETE f",
    params,
  )
}

export const mergeFiles = async (
  conn: GraphConnection,
  files: readonly FileGraphData[],
): Promise<void> => {
  const payload = files.map(filePayload)
  if (payload.length === 0) return
  await sendBatches(
    conn,
    payload,
    (batch) =>
      `UNWIND ${cypherFileBatch(batch)} AS file MERGE (f:File {path: file.path}) SET f.mtimeMs = file.mtimeMs, f.size = file.size, f.updatedAt = file.updatedAt`,
  )
}

export const mergeFileLinks = async (
  conn: GraphConnection,
  files: readonly FileGraphData[],
): Promise<void> => {
  const declared = files.flatMap((file) =>
    (file.declaredNodeIds ?? file.nodes.map((node) => node.id)).map((nodeId) => ({
      filePath: file.filePath,
      nodeId,
    })),
  )
  const contributed = files.flatMap((file) =>
    (file.contributedNodeIds ?? []).map((nodeId) => ({ filePath: file.filePath, nodeId })),
  )

  await sendBatches(
    conn,
    declared,
    (batch) =>
      `UNWIND ${cypherLinkBatch(batch)} AS link MATCH (f:File {path: link.filePath}), (n {id: link.nodeId}) MERGE (f)-[:DECLARES]->(n)`,
  )
  await sendBatches(
    conn,
    contributed,
    (batch) =>
      `UNWIND ${cypherLinkBatch(batch)} AS link MATCH (f:File {path: link.filePath}), (n {id: link.nodeId}) MERGE (f)-[:CONTRIBUTES]->(n)`,
  )
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

export const cleanupOrphanStubs = async (
  conn: GraphConnection,
  ignoreFileLinks = false,
): Promise<void> => {
  if (!ignoreFileLinks) {
    await query(
      conn,
      "MATCH (n) WHERE n.filePath IS NULL AND NOT ()-->(n) DETACH DELETE n",
    )
    return
  }

  await query(
    conn,
    [
      "MATCH (n)",
      "WHERE NOT (:File)-[:DECLARES]->(n)",
      "OPTIONAL MATCH ()-[r]->(n)",
      "WHERE type(r) <> 'DECLARES' AND type(r) <> 'CONTRIBUTES'",
      "WITH n, count(r) AS subjectIncoming",
      "WHERE subjectIncoming = 0",
      "DETACH DELETE n",
    ].join(" "),
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
