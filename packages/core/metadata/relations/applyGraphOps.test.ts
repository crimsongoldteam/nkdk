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
  graph.ensureNode(parentNodeId, { name: "Цена", filePaths: [filePath] })
  return { graph, parentNodeId, filePath, edgeKind: "TYPE", edgeYaml: "Тип" }
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
    it("создаёт child-узел с ребром kind=edgeName", () => {
      const ctx = makeCtx()
      const ops: GraphOps = {
        children: [{ idSuffix: "Валюта", name: "Валюта" }],
      }

      applyGraphOps(ops, ctx)

      const childId = "Справочник.Товары.Цена.Валюта"
      expect(ctx.graph.hasNode(childId)).toBe(true)
      const attrs = ctx.graph.getNodeAttributes(childId)
      expect(attrs.name).toBe("Валюта")
      expect(attrs.filePaths?.[0]).toBe("catalogs/goods.yaml")

      const edges = [...ctx.graph.outEdgeEntries("Справочник.Товары.Цена")]
      expect(edges).toHaveLength(1)
      expect(edges[0].attributes.kind).toBe("TYPE")
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
    it("создаёт stub-узел с ребром kind=edgeName", () => {
      const ctx = makeCtx()
      const ops: GraphOps = {
        references: [{ id: "Справочник.Валюты", name: "Валюты" }],
      }

      applyGraphOps(ops, ctx)

      expect(ctx.graph.hasNode("Справочник.Валюты")).toBe(true)
      const attrs = ctx.graph.getNodeAttributes("Справочник.Валюты")
      expect(attrs.name).toBe("Валюты")
      expect(attrs.filePaths).toBeUndefined()

      const edges = [...ctx.graph.outEdgeEntries("Справочник.Товары.Цена")]
      expect(edges).toHaveLength(1)
      expect(edges[0].attributes.kind).toBe("TYPE")
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
      graph.ensureNode("Справочник.Валюты", { name: "Валюты", filePaths: ["currencies.yaml"] })
      graph.setNodeAttribute("Справочник.Валюты", "item", ownedItem)

      applyGraphOps(
        { references: [{ id: "Справочник.Валюты", name: "Валюты" }] },
        makeCtx({ graph })
      )

      expect(graph.getNodeAttribute("Справочник.Валюты", "item")).toBe(ownedItem)
      expect(graph.getNodeAttribute("Справочник.Валюты", "filePaths")?.[0]).toBe("currencies.yaml")
    })

    it("stub-узел не получает filePath", () => {
      const ctx = makeCtx()
      applyGraphOps({ references: [{ id: "Справочник.Неизвестный", name: "Неизвестный" }] }, ctx)

      expect(ctx.graph.getNodeAttribute("Справочник.Неизвестный", "filePaths")).toBeUndefined()
      expect(ctx.graph.getNodeAttribute("Справочник.Неизвестный", "item")).toBeUndefined()
    })
  })

  describe("оба: children и references", () => {
    it("создаёт два ребра с kind=edgeName", () => {
      const ctx = makeCtx()
      const ops: GraphOps = {
        children: [{ idSuffix: "Дочерний", name: "Дочерний" }],
        references: [{ id: "Справочник.Внешний", name: "Внешний" }],
      }

      applyGraphOps(ops, ctx)

      const edges = [...ctx.graph.outEdgeEntries("Справочник.Товары.Цена")]
      expect(edges).toHaveLength(2)
      expect(edges.every((e) => e.attributes.kind === "TYPE")).toBe(true)
    })
  })

  describe("formLocalReferences", () => {
    // Готовит граф формы с минимальным набором узлов/рёбер,
    // достаточным для resolveFormLocalPath: форма + один реквизит формы
    // ("Объект"), от которого можно резолвить простые form-local пути.
    function makeFormGraph() {
      const graph = new MetadataGraph()
      const formNodeId = "Форма.ТестоваяФорма"
      const attrId = `${formNodeId}.Реквизит.Объект`
      graph.ensureNode(formNodeId, { name: "ТестоваяФорма", filePaths: ["test/Форма.yaml"] })
      graph.ensureNode(attrId, { name: "Объект", filePaths: ["test/Форма.yaml"] })
      const edgeKey = `${formNodeId}:FORM_ATTRIBUTE:${attrId}`
      graph.ensureEdge(edgeKey, formNodeId, attrId, { yaml: "РеквизитФормы", kind: "FORM_ATTRIBUTE" })
      return { graph, formNodeId, attrId }
    }

    it("создаёт ребро на резолвимую цель (happy path)", () => {
      const { graph, formNodeId, attrId } = makeFormGraph()
      const elementId = `${formNodeId}.Элемент.Кнопка`
      graph.ensureNode(elementId, { name: "Кнопка", filePaths: ["test/Форма.yaml"] })

      const ctx: ApplyGraphOpsContext = {
        graph,
        parentNodeId: elementId,
        filePath: "test/Форма.yaml",
        edgeKind: "DATA_PATH",
        edgeYaml: "ПутьКДанным",
      }
      const ops: GraphOps = {
        formLocalReferences: [{ formLocalPath: "Объект", formNodeId }],
      }
      applyGraphOps(ops, ctx)

      const edges = [...graph.outEdgeEntries(elementId)]
      expect(edges).toHaveLength(1)
      expect(edges[0].target).toBe(attrId)
      expect(edges[0].attributes.kind).toBe("DATA_PATH")
      expect(edges[0].attributes.yaml).toBe("ПутьКДанным")
    })

    it("не создаёт ребро, если resolveFormLocalPath вернул undefined (нет первого сегмента)", () => {
      const { graph, formNodeId } = makeFormGraph()
      const elementId = `${formNodeId}.Элемент.Кнопка`
      graph.ensureNode(elementId, { name: "Кнопка", filePaths: ["test/Форма.yaml"] })

      const ctx: ApplyGraphOpsContext = {
        graph,
        parentNodeId: elementId,
        filePath: "test/Форма.yaml",
        edgeKind: "DATA_PATH",
        edgeYaml: "ПутьКДанным",
      }
      const ops: GraphOps = {
        formLocalReferences: [{ formLocalPath: "НесуществующийРеквизит", formNodeId }],
      }
      applyGraphOps(ops, ctx)

      expect(graph.outEdges(elementId)).toHaveLength(0)
    })

    it("пробрасывает positionFrom на ребро", () => {
      const { graph, formNodeId, attrId } = makeFormGraph()
      const elementId = `${formNodeId}.Элемент.Кнопка`
      graph.ensureNode(elementId, { name: "Кнопка", filePaths: ["test/Форма.yaml"] })

      const ctx: ApplyGraphOpsContext = {
        graph,
        parentNodeId: elementId,
        filePath: "test/Форма.yaml",
        edgeKind: "DATA_PATH",
        edgeYaml: "ПутьКДанным",
      }
      const ops: GraphOps = {
        formLocalReferences: [{ formLocalPath: "Объект", formNodeId, positionFrom: { offset: 42 } }],
      }
      applyGraphOps(ops, ctx)

      const edges = [...graph.outEdgeEntries(elementId)]
      expect(edges).toHaveLength(1)
      expect(edges[0].attributes.positionFrom).toEqual({ offset: 42 })
    })

    it("пустой formLocalReferences не создаёт рёбер", () => {
      const { graph, formNodeId } = makeFormGraph()
      const elementId = `${formNodeId}.Элемент.Кнопка`
      graph.ensureNode(elementId, { name: "Кнопка", filePaths: ["test/Форма.yaml"] })

      const ctx: ApplyGraphOpsContext = {
        graph,
        parentNodeId: elementId,
        filePath: "test/Форма.yaml",
        edgeKind: "DATA_PATH",
        edgeYaml: "ПутьКДанным",
      }
      applyGraphOps({ formLocalReferences: [] }, ctx)

      expect(graph.outEdges(elementId)).toHaveLength(0)
    })
  })
})
