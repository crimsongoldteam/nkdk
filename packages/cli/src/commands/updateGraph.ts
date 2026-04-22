import { close, connect, ensureIndex, graphMemoryBytes, query } from "@nakidka/graph"
import type { GraphConnection } from "@nakidka/graph"
import { importMetadataFileWithGraph, MetadataGraph } from "@nakidka/core"
import chalk from "chalk"
import { existsSync, readdirSync, readFileSync } from "fs"
import { join } from "path"
import { performance } from "perf_hooks"

const BATCH_SIZE = 5000

const queryCount = async (conn: GraphConnection, cypher: string): Promise<number> => {
  const r = (await query(conn, cypher)) as { data?: Array<Record<string, unknown>> }
  const val = r.data?.[0]?.["cnt"]
  return typeof val === "number" ? val : 0
}

const sendBatches = async (
  conn: GraphConnection,
  items: Record<string, unknown>[],
  cypher: string,
): Promise<void> => {
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    await query(conn, cypher, { batch: items.slice(i, i + BATCH_SIZE) })
  }
}

export const updateGraph = async (projectPath: string): Promise<void> => {
  if (!existsSync(projectPath)) {
    console.error(chalk.red(`Директория не найдена: ${projectPath}`))
    process.exit(1)
  }

  const tStart = performance.now()

  // === 1. Чтение YAML ===
  const tReadStart = performance.now()
  const yamlFiles: Array<{ path: string; text: string; name: string }> = []
  const catalogsPath = join(projectPath, "Справочник")
  if (existsSync(catalogsPath)) {
    for (const dir of readdirSync(catalogsPath, { withFileTypes: true }).filter((e) =>
      e.isDirectory(),
    )) {
      const yamlPath = join(catalogsPath, dir.name, "Свойства.yaml")
      if (!existsSync(yamlPath)) continue
      try {
        const text = readFileSync(yamlPath, "utf-8")
        yamlFiles.push({ path: yamlPath, text, name: dir.name })
      } catch (err) {
        console.warn(chalk.yellow(`Предупреждение: не удалось прочитать ${yamlPath}: ${err}`))
      }
    }
  }
  const tRead = performance.now() - tReadStart

  // === 2. fromYAML → MetadataGraph ===
  const tFromYamlStart = performance.now()
  const graph = new MetadataGraph()
  const importContext = { version: "2.20", defaultLanguage: "ru" }
  for (const { path: yamlPath, text, name } of yamlFiles) {
    try {
      importMetadataFileWithGraph({ filePath: yamlPath, sources: { yaml: text }, kind: "catalog", name, graph, context: importContext })
    } catch (err) {
      console.warn(chalk.yellow(`Предупреждение: не удалось импортировать ${yamlPath}: ${err}`))
    }
  }
  const heapMB = process.memoryUsage().heapUsed / 1024 / 1024
  const tFromYaml = performance.now() - tFromYamlStart

  // === 3. Connect + indexes ===
  const tConnectStart = performance.now()
  const conn = await connect()
  await ensureIndex(conn, "MetadataNode", "id")
  await ensureIndex(conn, "MetadataNode", "path")
  const tConnect = performance.now() - tConnectStart

  try {
    // === 4. Mark candidates ===
    const tMarkStart = performance.now()
    await query(
      conn,
      "MATCH (n:MetadataNode) REMOVE n.path, n.offset, n.length, n.resolved",
    )
    await query(conn, "MATCH (n:MetadataNode)-[r]->() DELETE r")
    const tMark = performance.now() - tMarkStart

    // === 5. Re-import: собираем батчи узлов и рёбер ===
    type NodeRecord = Record<string, unknown>
    const fullNodes: NodeRecord[] = []
    const stubNodes: NodeRecord[] = []
    // Группировка рёбер по семантическому kind — для статических Cypher-label'ов
    const edgesByKind = new Map<string, NodeRecord[]>()

    for (const nodeId of graph.nodes()) {
      const attrs = graph.getNodeAttributes(nodeId)
      if (attrs.item !== undefined) {
        fullNodes.push({
          id: nodeId,
          name: attrs.name,
          path: attrs.filePaths?.[0] ?? null,
          offset: attrs.positionFrom?.offset ?? null,
          length: attrs.positionFrom?.length ?? null,
        })
      } else {
        stubNodes.push({ id: nodeId, name: attrs.name })
      }
      for (const { target, attributes } of graph.outEdgeEntries(nodeId)) {
        const edge: NodeRecord = {
          src: nodeId,
          tgt: target,
          yaml: attributes.yaml,
        }
        const group = edgesByKind.get(attributes.kind) ?? []
        group.push(edge)
        edgesByKind.set(attributes.kind, group)
      }
    }

    const tInsertNodesStart = performance.now()
    await sendBatches(
      conn,
      fullNodes,
      "UNWIND $batch AS n MERGE (m:MetadataNode {id: n.id}) SET m.name = n.name, m.path = n.path, m.offset = n.offset, m.length = n.length, m.resolved = true",
    )
    await sendBatches(
      conn,
      stubNodes,
      "UNWIND $batch AS n MERGE (m:MetadataNode {id: n.id}) SET m.name = n.name",
    )
    const tInsertNodes = performance.now() - tInsertNodesStart
    const totalNodes = fullNodes.length + stubNodes.length

    const tInsertEdgesStart = performance.now()
    let totalEdges = 0
    for (const [kind, edges] of edgesByKind) {
      await sendBatches(
        conn,
        edges,
        `UNWIND $batch AS e MATCH (s:MetadataNode {id: e.src}), (t:MetadataNode {id: e.tgt}) CREATE (s)-[:${kind} {yaml: e.yaml}]->(t)`,
      )
      totalEdges += edges.length
    }
    const tInsertEdges = performance.now() - tInsertEdgesStart

    // === 6. Cleanup ===
    const tCleanupStart = performance.now()
    const stubsPreCleanup = await queryCount(
      conn,
      "MATCH (n:MetadataNode) WHERE n.path IS NULL RETURN count(n) AS cnt",
    )
    await query(
      conn,
      "MATCH (n:MetadataNode) WHERE n.path IS NULL AND NOT ()-[]->(n) DETACH DELETE n",
    )
    await query(
      conn,
      "MATCH (n:MetadataNode) WHERE n.path IS NULL SET n.resolved = false",
    )
    const remainingStubs = await queryCount(
      conn,
      "MATCH (n:MetadataNode) WHERE n.resolved = false RETURN count(n) AS cnt",
    )
    const deletedCount = stubsPreCleanup - remainingStubs
    const tCleanup = performance.now() - tCleanupStart

    const tTotal = performance.now() - tStart

    // === Итоговые цифры ===
    const totalDbNodes = await queryCount(
      conn,
      "MATCH (n:MetadataNode) RETURN count(n) AS cnt",
    )
    const totalDbEdges = await queryCount(
      conn,
      "MATCH ()-[r]->() RETURN count(r) AS cnt",
    )
    const memBytes = await graphMemoryBytes(conn)

    console.log(`чтение YAML      — ${tRead.toFixed(1)} мс`)
    console.log(`fromYAML         — ${tFromYaml.toFixed(1)} мс — heap ${heapMB.toFixed(1)} МБ`)
    console.log(`connect+indexes  — ${tConnect.toFixed(1)} мс`)
    console.log(`mark candidates  — ${tMark.toFixed(1)} мс`)
    console.log(`insert nodes     — ${tInsertNodes.toFixed(1)} мс — ${totalNodes} шт.`)
    const kindCounts = [...edgesByKind.entries()].map(([k, v]) => `${k}: ${v.length}`).join(", ")
    console.log(
      `insert edges     — ${tInsertEdges.toFixed(1)} мс — ${totalEdges} шт. (${kindCounts})`,
    )
    console.log(`cleanup          — ${tCleanup.toFixed(1)} мс — удалено ${deletedCount}, заглушек ${remainingStubs}`)
    console.log(`итого            — ${tTotal.toFixed(1)} мс`)
    console.log("")
    console.log(`узлов в БД: ${totalDbNodes} (резолвнутых ${totalDbNodes - remainingStubs}, заглушек ${remainingStubs})`)
    console.log(`рёбер в БД: ${totalDbEdges}`)
    console.log(
      `граф в FalkorDB: ${memBytes !== null ? (memBytes / 1024 / 1024).toFixed(2) + " МБ" : "недоступно"}`,
    )
    console.log(`heap JS: ${heapMB.toFixed(1)} МБ`)
  } finally {
    await close(conn)
  }
}
