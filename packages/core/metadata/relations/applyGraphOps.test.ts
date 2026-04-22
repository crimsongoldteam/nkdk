import { describe, expect, it } from "vitest"
import { GraphOps } from "../orchestration/property/fn"
import { applyGraphOps, ApplyGraphOpsContext } from "./applyGraphOps"
import { MetadataGraph } from "./MetadataGraph"

const PARENT_NODE_ID = "Справочник.Товары.Цена"
const FILE_PATH = "catalogs/goods.yaml"

function makeCtx(overrides?: Partial<ApplyGraphOpsContext>): ApplyGraphOpsContext {
  const graph = overrides?.graph ?? new MetadataGraph()
  const parentNodeId = overrides?.parentNodeId ?? PARENT_NODE_ID
  const filePath = overrides?.filePath ?? FILE_PATH
  // Parent node must exist in the graph before applyGraphOps can add edges from it
  graph.ensureNode(parentNodeId, { name: "Цена", filePath })
  return { graph, parentNodeId, filePath, edgeName: "Тип" }
}

describe("applyGraphOps", () => {
  describe("пустой GraphOps", () => {
    it("не создаёт дополнительных узлов и рёбер", () => {
      const ctx = makeCtx()
      applyGraphOps({}, ctx)

      // только родительский узел, добавленный makeCtx
      expect(ctx.graph.nodes()).toHaveLength(1)
      expect(ctx.graph.outEdges(PARENT_NODE_ID)).toHaveLength(0)
    })

    it("работает с явными пустыми массивами", () => {
      const ctx = makeCtx()
      applyGraphOps({ children: [], references: [] }, ctx)

      expect(ctx.graph.nodes()).toHaveLength(1)
      expect(ctx.graph.outEdges(PARENT_NODE_ID)).toHaveLength(0)
    })
  })

  describe("только children", () => {
    it("создаёт child-узел с composition-ребром", () => {
      const ctx = makeCtx()
      const ops: GraphOps = {
        children: [{ idSuffix: "Валюта", name: "Валюта" }],
      }

      applyGraphOps(ops, ctx)

      const childId = "Справочник.Товары.Цена.Валюта"
      expect(ctx.graph.hasNode(childId)).toBe(true)
      const attrs = ctx.graph.getNodeAttributes(childId)
      expect(attrs.name).toBe("Валюта")
      expect(attrs.filePath).toBe("catalogs/goods.yaml")

      const edges = [...ctx.graph.outEdgeEntries("Справочник.Товары.Цена")]
      expect(edges).toHaveLength(1)
      expect(edges[0].attributes.kind).toBe("composition")
      expect(edges[0].attributes.name).toBe("Тип")
    })

    it("пробрасывает positionFrom на узел", () => {
      const ctx = makeCtx()
      const ops: GraphOps = {
        children: [{ idSuffix: "Валюта", name: "Валюта", positionFrom: { offset: 42, length: 7 } }],
      }

      applyGraphOps(ops, ctx)

      const attrs = ctx.graph.getNodeAttributes("Справочник.Товары.Цена.Валюта")
      expect(attrs.positionFrom).toEqual({ offset: 42, length: 7 })
    })

    it("создаёт несколько child-узлов", () => {
      const ctx = makeCtx()
      const ops: GraphOps = {
        children: [
          { idSuffix: "А", name: "А" },
          { idSuffix: "Б", name: "Б" },
        ],
      }

      applyGraphOps(ops, ctx)

      expect(ctx.graph.hasNode("Справочник.Товары.Цена.А")).toBe(true)
      expect(ctx.graph.hasNode("Справочник.Товары.Цена.Б")).toBe(true)
      expect(ctx.graph.outEdges("Справочник.Товары.Цена")).toHaveLength(2)
    })

    it("child-узел индексируется по filePath", () => {
      const ctx = makeCtx()
      applyGraphOps({ children: [{ idSuffix: "Дочерний", name: "Дочерний" }] }, ctx)

      const nodes = ctx.graph.getNodesByFile("catalogs/goods.yaml")
      expect(nodes.has("Справочник.Товары.Цена.Дочерний")).toBe(true)
    })
  })

  describe("только references", () => {
    it("создаёт stub-узел с reference-ребром", () => {
      const ctx = makeCtx()
      const ops: GraphOps = {
        references: [{ id: "Справочник.Валюты", name: "Валюты" }],
      }

      applyGraphOps(ops, ctx)

      expect(ctx.graph.hasNode("Справочник.Валюты")).toBe(true)
      const attrs = ctx.graph.getNodeAttributes("Справочник.Валюты")
      expect(attrs.name).toBe("Валюты")
      expect(attrs.filePath).toBeUndefined()

      const edges = [...ctx.graph.outEdgeEntries("Справочник.Товары.Цена")]
      expect(edges).toHaveLength(1)
      expect(edges[0].attributes.kind).toBe("reference")
      expect(edges[0].attributes.name).toBe("Тип")
    })

    it("пробрасывает positionFrom на reference-ребро", () => {
      const ctx = makeCtx()
      const ops: GraphOps = {
        references: [{ id: "Справочник.Валюты", name: "Валюты", positionFrom: { offset: 100, length: 20 } }],
      }

      applyGraphOps(ops, ctx)

      const edges = [...ctx.graph.outEdgeEntries("Справочник.Товары.Цена")]
      expect(edges[0].attributes.positionFrom).toEqual({ offset: 100, length: 20 })
    })

    it("ссылка без positionFrom не ставит атрибут на ребро", () => {
      const ctx = makeCtx()
      applyGraphOps({ references: [{ id: "Справочник.Валюты", name: "Валюты" }] }, ctx)

      const edges = [...ctx.graph.outEdgeEntries("Справочник.Товары.Цена")]
      expect(edges[0].attributes.positionFrom).toBeUndefined()
    })

    it("создаёт несколько reference-узлов", () => {
      const ctx = makeCtx()
      const ops: GraphOps = {
        references: [
          { id: "Справочник.А", name: "А" },
          { id: "Справочник.Б", name: "Б" },
        ],
      }

      applyGraphOps(ops, ctx)

      expect(ctx.graph.hasNode("Справочник.А")).toBe(true)
      expect(ctx.graph.hasNode("Справочник.Б")).toBe(true)
      expect(ctx.graph.outEdges("Справочник.Товары.Цена")).toHaveLength(2)
    })
  })

  describe("stub-vs-owned", () => {
    it("не перезаписывает owned-узел при повторном reference", () => {
      const graph = new MetadataGraph()
      const ownedItem = { itemType: "MetadataCatalog", name: "Валюты" }
      graph.ensureNode("Справочник.Валюты", { name: "Валюты", filePath: "currencies.yaml" })
      graph.setNodeAttribute("Справочник.Валюты", "item", ownedItem)

      applyGraphOps(
        { references: [{ id: "Справочник.Валюты", name: "Валюты" }] },
        makeCtx({ graph })
      )

      expect(graph.getNodeAttribute("Справочник.Валюты", "item")).toBe(ownedItem)
      expect(graph.getNodeAttribute("Справочник.Валюты", "filePath")).toBe("currencies.yaml")
    })

    it("stub-узел не получает filePath", () => {
      const ctx = makeCtx()
      applyGraphOps({ references: [{ id: "Справочник.Неизвестный", name: "Неизвестный" }] }, ctx)

      expect(ctx.graph.getNodeAttribute("Справочник.Неизвестный", "filePath")).toBeUndefined()
      expect(ctx.graph.getNodeAttribute("Справочник.Неизвестный", "item")).toBeUndefined()
    })
  })

  describe("оба: children и references", () => {
    it("создаёт и composition- и reference-рёбра", () => {
      const ctx = makeCtx()
      const ops: GraphOps = {
        children: [{ idSuffix: "Дочерний", name: "Дочерний" }],
        references: [{ id: "Справочник.Внешний", name: "Внешний" }],
      }

      applyGraphOps(ops, ctx)

      const edges = [...ctx.graph.outEdgeEntries("Справочник.Товары.Цена")]
      const kinds = edges.map((e) => e.attributes.kind).sort()
      expect(kinds).toEqual(["composition", "reference"])
    })
  })
})
