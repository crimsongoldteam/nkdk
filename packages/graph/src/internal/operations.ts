import { ensureIndex, query } from "./connection"
import type { GraphConnection } from "./connection"
import type { EdgeData, FileGraphData, FileStats, GraphProgress, GraphUpdatePhase, NodeData } from "../types"

export const BATCH_SIZE = 500
const GRAPH_NODE_LABEL = "GraphNode"

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

const cypherLookupLabel = (label: string | undefined): string =>
  cypherLabel(label && label.length > 0 ? label : GRAPH_NODE_LABEL)

const cypherMergeLabels = (label: string): string => {
  const labels = [label, GRAPH_NODE_LABEL].filter((value, index, all) =>
    value.length > 0 && all.indexOf(value) === index
  )
  return labels.map(cypherLabel).join("")
}

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

const assertUnique = (seen: Set<string>, key: string, message: string): void => {
  if (seen.has(key)) throw new Error(message)
  seen.add(key)
}

export const validateReplacePayload = (files: readonly FileGraphData[]): void => {
  const filePaths = new Set<string>()
  const nodeIds = new Set<string>()
  const declaredLinks = new Set<string>()
  const contributedLinks = new Set<string>()

  for (const file of files) {
    assertUnique(filePaths, file.filePath, `Duplicate File.path in replace payload: ${file.filePath}`)

    for (const node of file.nodes) {
      assertUnique(nodeIds, node.id, `Duplicate Node.id in replace payload: ${node.id}`)
    }

    for (const nodeId of file.declaredNodeIds ?? file.nodes.map((node) => node.id)) {
      const key = `${file.filePath}\u0000${nodeId}`
      assertUnique(declaredLinks, key, `Duplicate DECLARES link in replace payload: ${file.filePath} -> ${nodeId}`)
    }

    for (const nodeId of file.contributedNodeIds ?? []) {
      const key = `${file.filePath}\u0000${nodeId}`
      assertUnique(contributedLinks, key, `Duplicate CONTRIBUTES link in replace payload: ${file.filePath} -> ${nodeId}`)
    }
  }
}

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

const batchCount = (itemsLength: number): number => Math.ceil(itemsLength / BATCH_SIZE)

const sendBatches = async <T>(
  conn: GraphConnection,
  items: readonly T[],
  buildCypher: (batch: readonly T[]) => string,
  progress?: {
    phase: GraphUpdatePhase
    onProgress?: (progress: GraphProgress) => void
    total: number
    state: { done: number }
  },
): Promise<void> => {
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    await query(conn, buildCypher(items.slice(i, i + BATCH_SIZE)))
    if (progress) progress.state.done += 1
    progress?.onProgress?.({
      phase: progress.phase,
      done: progress.state.done,
      total: progress.total,
    })
  }
}

export const mergeNodes = async (
  conn: GraphConnection,
  nodes: readonly NodeData[],
  onProgress?: (progress: GraphProgress) => void,
): Promise<void> => {
  if (nodes.length === 0) return
  const byLabel = groupBy(nodes, (n) => n.label)
  const groups = Array.from(byLabel.entries()).map(([label, group]) => ({
    label,
    payload: group.map((n) => ({ id: n.id, props: n.props })),
  }))
  const progress = {
    phase: "mergeNodes" as const,
    onProgress,
    total: groups.reduce((sum, group) => sum + batchCount(group.payload.length), 0),
    state: { done: 0 },
  }
  for (const { label, payload } of groups) {
    await sendBatches(
      conn,
      payload,
      (batch) =>
        `UNWIND ${cypherNodeBatch(batch)} AS n MERGE (m${cypherMergeLabels(label)} {id: n.id}) SET m += n.props`,
      progress,
    )
  }
}

export const createNodes = async (
  conn: GraphConnection,
  nodes: readonly NodeData[],
  onProgress?: (progress: GraphProgress) => void,
): Promise<void> => {
  if (nodes.length === 0) return
  const byLabel = groupBy(nodes, (n) => n.label)
  const groups = Array.from(byLabel.entries()).map(([label, group]) => ({
    label,
    payload: group.map((n) => ({ id: n.id, props: n.props })),
  }))
  const progress = {
    phase: "createNodes" as const,
    onProgress,
    total: groups.reduce((sum, group) => sum + batchCount(group.payload.length), 0),
    state: { done: 0 },
  }
  for (const { label, payload } of groups) {
    await sendBatches(
      conn,
      payload,
      (batch) =>
        `UNWIND ${cypherNodeBatch(batch)} AS n CREATE (m${cypherMergeLabels(label)} {id: n.id}) SET m += n.props`,
      progress,
    )
  }
}

export const mergeEdges = async (
  conn: GraphConnection,
  files: readonly FileGraphData[] | readonly EdgeData[],
  labelByNodeId?: ReadonlyMap<string, string>,
  onProgress?: (progress: GraphProgress) => void,
): Promise<void> => {
  if (files.length > 0 && !("filePath" in files[0])) {
    await mergeLegacyEdges(conn, files as readonly EdgeData[], labelByNodeId, onProgress)
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
  const groups = Array.from(byKindAndLabels.entries()).map(([groupKey, group]) => {
    const [kind, srcLabel, tgtLabel] = groupKey.split("\u0000") as [string, string, string]
    return {
      kind,
      srcLabel,
      tgtLabel,
      payload: group.map((e) => ({
        src: e.src,
        tgt: e.tgt,
        filePath: e.filePath,
        props: e.props ?? {},
      })),
    }
  })
  const progress = {
    phase: "mergeEdges" as const,
    onProgress,
    total: groups.reduce((sum, group) => sum + batchCount(group.payload.length), 0),
    state: { done: 0 },
  }
  for (const { kind, srcLabel, tgtLabel, payload } of groups) {
    await sendBatches(
      conn,
      payload,
      (batch) =>
        `UNWIND ${cypherEdgeBatch(batch)} AS e MATCH (s${cypherLookupLabel(srcLabel)} {id: e.src}), (t${cypherLookupLabel(tgtLabel)} {id: e.tgt}) MERGE (s)-[r:${kind}]->(t) SET r = e.props SET r.filePath = e.filePath`,
      progress,
    )
  }
}

export const createEdges = async (
  conn: GraphConnection,
  files: readonly FileGraphData[],
  labelByNodeId?: ReadonlyMap<string, string>,
  onProgress?: (progress: GraphProgress) => void,
): Promise<void> => {
  const edges = files.flatMap((file) =>
    file.edges.map((edge) => ({ ...edge, filePath: file.filePath })),
  )
  if (edges.length === 0) return
  const byKindAndLabels = groupBy(
    edges,
    (e) =>
      `${e.kind}\u0000${labelByNodeId?.get(e.src) ?? ""}\u0000${labelByNodeId?.get(e.tgt) ?? ""}`,
  )
  const groups = Array.from(byKindAndLabels.entries()).map(([groupKey, group]) => {
    const [kind, srcLabel, tgtLabel] = groupKey.split("\u0000") as [string, string, string]
    return {
      kind,
      srcLabel,
      tgtLabel,
      payload: group.map((e) => ({
        src: e.src,
        tgt: e.tgt,
        filePath: e.filePath,
        props: e.props ?? {},
      })),
    }
  })
  const progress = {
    phase: "createEdges" as const,
    onProgress,
    total: groups.reduce((sum, group) => sum + batchCount(group.payload.length), 0),
    state: { done: 0 },
  }
  for (const { kind, srcLabel, tgtLabel, payload } of groups) {
    await sendBatches(
      conn,
      payload,
      (batch) =>
        `UNWIND ${cypherEdgeBatch(batch)} AS e MATCH (s${cypherLookupLabel(srcLabel)} {id: e.src}), (t${cypherLookupLabel(tgtLabel)} {id: e.tgt}) CREATE (s)-[r:${kind}]->(t) SET r = e.props SET r.filePath = e.filePath`,
      progress,
    )
  }
}

export const mergeLegacyEdges = async (
  conn: GraphConnection,
  edges: readonly EdgeData[],
  labelByNodeId?: ReadonlyMap<string, string>,
  onProgress?: (progress: GraphProgress) => void,
): Promise<void> => {
  if (edges.length === 0) return
  const byKindAndLabels = groupBy(
    edges,
    (e) =>
      `${e.kind}\u0000${labelByNodeId?.get(e.src) ?? ""}\u0000${labelByNodeId?.get(e.tgt) ?? ""}`,
  )
  const groups = Array.from(byKindAndLabels.entries()).map(([groupKey, group]) => {
    const [kind, srcLabel, tgtLabel] = groupKey.split("\u0000") as [string, string, string]
    return {
      kind,
      srcLabel,
      tgtLabel,
      payload: group.map((e) => ({ src: e.src, tgt: e.tgt, props: e.props ?? {} })),
    }
  })
  const progress = {
    phase: "mergeEdges" as const,
    onProgress,
    total: groups.reduce((sum, group) => sum + batchCount(group.payload.length), 0),
    state: { done: 0 },
  }
  for (const { kind, srcLabel, tgtLabel, payload } of groups) {
    await sendBatches(
      conn,
      payload,
      (batch) =>
        `UNWIND ${cypherLegacyEdgeBatch(batch)} AS e MATCH (s${cypherLookupLabel(srcLabel)} {id: e.src}), (t${cypherLookupLabel(tgtLabel)} {id: e.tgt}) MERGE (s)-[r:${kind}]->(t) SET r = e.props`,
      progress,
    )
  }
}

export const ensureFileIndexes = async (conn: GraphConnection): Promise<void> => {
  await ensureIndex(conn, "File", "path")
}

export const resetGraph = async (conn: GraphConnection): Promise<void> => {
  await query(conn, "MATCH (n) DETACH DELETE n")
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
      "WHERE type(out) <> 'DECLARES' AND type(out) <> 'CONTRIBUTES' AND out.filePath IN $filePaths",
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
  onProgress?: (progress: GraphProgress) => void,
): Promise<void> => {
  const payload = files.map(filePayload)
  if (payload.length === 0) return
  await sendBatches(
    conn,
    payload,
    (batch) =>
      `UNWIND ${cypherFileBatch(batch)} AS file MERGE (f:File {path: file.path}) SET f.mtimeMs = file.mtimeMs, f.size = file.size, f.updatedAt = file.updatedAt`,
    { phase: "mergeFiles", onProgress, total: batchCount(payload.length), state: { done: 0 } },
  )
}

export const createFiles = async (
  conn: GraphConnection,
  files: readonly FileGraphData[],
  onProgress?: (progress: GraphProgress) => void,
): Promise<void> => {
  const payload = files.map(filePayload)
  if (payload.length === 0) return
  await sendBatches(
    conn,
    payload,
    (batch) =>
      `UNWIND ${cypherFileBatch(batch)} AS file CREATE (f:File {path: file.path, mtimeMs: file.mtimeMs, size: file.size, updatedAt: file.updatedAt})`,
    { phase: "createFiles", onProgress, total: batchCount(payload.length), state: { done: 0 } },
  )
}

export const mergeFileLinks = async (
  conn: GraphConnection,
  files: readonly FileGraphData[],
  onProgress?: (progress: GraphProgress) => void,
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
  const progress = {
    phase: "mergeFileLinks" as const,
    onProgress,
    total: batchCount(declared.length) + batchCount(contributed.length),
    state: { done: 0 },
  }

  await sendBatches(
    conn,
    declared,
    (batch) =>
      `UNWIND ${cypherLinkBatch(batch)} AS link MATCH (f:File {path: link.filePath}), (n:GraphNode {id: link.nodeId}) MERGE (f)-[:DECLARES]->(n)`,
    progress,
  )
  await sendBatches(
    conn,
    contributed,
    (batch) =>
      `UNWIND ${cypherLinkBatch(batch)} AS link MATCH (f:File {path: link.filePath}), (n:GraphNode {id: link.nodeId}) MERGE (f)-[:CONTRIBUTES]->(n)`,
    progress,
  )
}

export const createFileLinks = async (
  conn: GraphConnection,
  files: readonly FileGraphData[],
  onProgress?: (progress: GraphProgress) => void,
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
  const progress = {
    phase: "createFileLinks" as const,
    onProgress,
    total: batchCount(declared.length) + batchCount(contributed.length),
    state: { done: 0 },
  }

  await sendBatches(
    conn,
    declared,
    (batch) =>
      `UNWIND ${cypherLinkBatch(batch)} AS link MATCH (f:File {path: link.filePath}), (n:GraphNode {id: link.nodeId}) CREATE (f)-[:DECLARES]->(n)`,
    progress,
  )
  await sendBatches(
    conn,
    contributed,
    (batch) =>
      `UNWIND ${cypherLinkBatch(batch)} AS link MATCH (f:File {path: link.filePath}), (n:GraphNode {id: link.nodeId}) CREATE (f)-[:CONTRIBUTES]->(n)`,
    progress,
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
      "MATCH (n) WHERE n.filePath IS NULL AND NOT n:File AND NOT ()-->(n) DETACH DELETE n",
    )
    return
  }

  await query(
    conn,
    [
      "MATCH (n)",
      "WHERE NOT n:File",
      "WITH n",
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
  await ensureIndex(conn, GRAPH_NODE_LABEL, "id")
  const unique = new Set(labels)
  for (const label of unique) {
    if (label === GRAPH_NODE_LABEL) continue
    await ensureIndex(conn, label, "id")
  }
}
