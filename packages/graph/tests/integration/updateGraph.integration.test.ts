import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { startFalkorDB, stopFalkorDB } from "./setup"
import { updateGraph, withGraph } from "../../src/index"
import type { FileGraphData } from "../../src/index"

let url: string
const graphName = "test_nakidka"

beforeAll(async () => {
  ;({ url } = await startFalkorDB())
}, 60_000)

afterAll(async () => {
  await stopFalkorDB()
}, 30_000)

beforeEach(async () => {
  await withGraph(
    async (g) => {
      await g.query("MATCH (n) DETACH DELETE n")
    },
    { url, graphName },
  )
})

const opts = () => ({ url, graphName })

describe("updateGraph (integration)", () => {
  it("создаёт узлы с динамическими метками и свойствами", async () => {
    const files: FileGraphData[] = [
      {
        filePath: "a.yaml",
        nodes: [
          {
            id: "Справочник.Контрагенты",
            label: "MetadataCatalog",
            props: { name: "Контрагенты", filePath: "a.yaml", p_hierarchical: true },
          },
        ],
        edges: [],
      },
    ]
    await updateGraph(files, opts())

    const rows = await withGraph(
      async (g) =>
        await g.query<{ id: string; name: string; hier: boolean }>(
          "MATCH (n:MetadataCatalog) RETURN n.id AS id, n.name AS name, n.p_hierarchical AS hier",
        ),
      opts(),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id: "Справочник.Контрагенты",
      name: "Контрагенты",
      hier: true,
    })
  })

  it("создаёт ребро между узлами по (src, kind, tgt)", async () => {
    const files: FileGraphData[] = [
      {
        filePath: "a.yaml",
        nodes: [
          { id: "A", label: "MetadataCatalog", props: { name: "A", filePath: "a.yaml" } },
          { id: "B", label: "MetadataCatalog", props: { name: "B", filePath: "a.yaml" } },
        ],
        edges: [{ src: "A", tgt: "B", kind: "VALUE", props: { yaml: "Значение" } }],
      },
    ]
    await updateGraph(files, opts())

    const rows = await withGraph(
      async (g) =>
        await g.query<{ src: string; tgt: string; yaml: string }>(
          "MATCH (s)-[r:VALUE]->(t) RETURN s.id AS src, t.id AS tgt, r.yaml AS yaml",
        ),
      opts(),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual({ src: "A", tgt: "B", yaml: "Значение" })
  })

  it("превращает ref-target в stub при удалении файла-определения", async () => {
    await updateGraph(
      [
        {
          filePath: "a.yaml",
          nodes: [
            { id: "A", label: "MetadataCatalog", props: { name: "A", filePath: "a.yaml" } },
          ],
          edges: [{ src: "A", tgt: "B", kind: "VALUE" }],
        },
        {
          filePath: "b.yaml",
          nodes: [
            { id: "B", label: "MetadataCatalog", props: { name: "B", filePath: "b.yaml", p_hierarchical: false } },
          ],
          edges: [],
        },
      ],
      opts(),
    )

    await updateGraph(
      [{ filePath: "b.yaml", nodes: [], edges: [] }],
      opts(),
    )

    const rows = await withGraph(
      async (g) =>
        await g.query<{ id: string; fp: string | null; hier: boolean | null }>(
          "MATCH (n) WHERE n.id = 'B' RETURN n.id AS id, n.filePath AS fp, n.p_hierarchical AS hier",
        ),
      opts(),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]?.fp).toBeNull()
    expect(rows[0]?.hier).toBeNull()
  })

  it("удаляет orphan-stub при cleanup", async () => {
    await updateGraph(
      [
        {
          filePath: "a.yaml",
          nodes: [
            { id: "A", label: "MetadataCatalog", props: { name: "A", filePath: "a.yaml" } },
          ],
          edges: [{ src: "A", tgt: "B", kind: "VALUE" }],
        },
        {
          filePath: "b.yaml",
          nodes: [
            { id: "B", label: "MetadataCatalog", props: { name: "B", filePath: "b.yaml" } },
          ],
          edges: [],
        },
      ],
      opts(),
    )

    await updateGraph(
      [
        { filePath: "a.yaml", nodes: [], edges: [] },
        { filePath: "b.yaml", nodes: [], edges: [] },
      ],
      opts(),
    )

    const rows = await withGraph(
      async (g) =>
        await g.query<{ cnt: number }>(
          "MATCH (n) WHERE n.id IN ['A', 'B'] RETURN count(n) AS cnt",
        ),
      opts(),
    )
    expect(rows[0]?.cnt).toBe(0)
  })

  it("повторный updateGraph не создаёт дубликатов", async () => {
    const files: FileGraphData[] = [
      {
        filePath: "a.yaml",
        nodes: [
          { id: "A", label: "MetadataCatalog", props: { name: "A", filePath: "a.yaml" } },
        ],
        edges: [],
      },
    ]
    await updateGraph(files, opts())
    await updateGraph(files, opts())

    const rows = await withGraph(
      async (g) =>
        await g.query<{ cnt: number }>("MATCH (n:MetadataCatalog) RETURN count(n) AS cnt"),
      opts(),
    )
    expect(rows[0]?.cnt).toBe(1)
  })

  it("replace-режим создаёт тот же маленький граф, что и обычный полный путь", async () => {
    const files: FileGraphData[] = [
      {
        filePath: "a.yaml",
        fileStats: { mtimeMs: 1, size: 2, updatedAt: 3 },
        nodes: [
          { id: "A", label: "MetadataCatalog", props: { name: "A", p_hierarchical: true } },
          { id: "B", label: "MetadataAttribute", props: { name: "B" } },
        ],
        edges: [{ src: "A", tgt: "B", kind: "VALUE", props: { yaml: "Реквизит" } }],
        declaredNodeIds: ["A"],
        contributedNodeIds: ["B"],
      },
    ]

    await updateGraph(files, opts())
    const normalRows = await withGraph(
      async (g) =>
        await g.query<{ files: number; nodes: number; values: number; declares: number; contributes: number }>(
          [
            "MATCH (f:File)",
            "WITH count(f) AS files",
            "MATCH (n:GraphNode)",
            "WITH files, count(n) AS nodes",
            "MATCH ()-[value:VALUE]->()",
            "WITH files, nodes, count(value) AS values",
            "MATCH (:File)-[declares:DECLARES]->()",
            "WITH files, nodes, values, count(declares) AS declares",
            "MATCH (:File)-[contributes:CONTRIBUTES]->()",
            "RETURN files, nodes, values, declares, count(contributes) AS contributes",
          ].join(" "),
        ),
      opts(),
    )

    await updateGraph(files, { ...opts(), replace: true })
    const replaceRows = await withGraph(
      async (g) =>
        await g.query<{ files: number; nodes: number; values: number; declares: number; contributes: number }>(
          [
            "MATCH (f:File)",
            "WITH count(f) AS files",
            "MATCH (n:GraphNode)",
            "WITH files, count(n) AS nodes",
            "MATCH ()-[value:VALUE]->()",
            "WITH files, nodes, count(value) AS values",
            "MATCH (:File)-[declares:DECLARES]->()",
            "WITH files, nodes, values, count(declares) AS declares",
            "MATCH (:File)-[contributes:CONTRIBUTES]->()",
            "RETURN files, nodes, values, declares, count(contributes) AS contributes",
          ].join(" "),
        ),
      opts(),
    )

    expect(replaceRows).toEqual(normalRows)
    expect(replaceRows[0]).toEqual({ files: 1, nodes: 2, values: 1, declares: 1, contributes: 1 })
  })
})
