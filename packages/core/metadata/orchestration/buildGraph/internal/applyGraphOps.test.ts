import { describe, expect, it } from "vitest"
import { GraphOps } from "~/metadata/orchestration/property/fn"
import { applyGraphOps, ApplyGraphOpsContext } from "./applyGraphOps"
import { GraphBuilder } from "./GraphBuilder"

const PARENT_NODE_ID = "Catalog.Товары.Цена"
const FILE_PATH = "catalogs/goods.yaml"

function ensureNodeWithFile(graph: GraphBuilder, id: string, name: string, filePath: string): void {
  graph.ensureNode(id, { name })
  graph.addFilePath(id, filePath)
}

function makeCtx(overrides?: Partial<ApplyGraphOpsContext>): ApplyGraphOpsContext {
  const graph = overrides?.graph ?? new GraphBuilder()
  const parentNodeId = overrides?.parentNodeId ?? PARENT_NODE_ID
  const filePath = overrides?.filePath ?? FILE_PATH
  ensureNodeWithFile(graph, parentNodeId, "Цена", filePath)
  return { graph, parentNodeId, filePath, edgeKind: "TYPE", edgeYaml: "Тип" }
}

describe("applyGraphOps", () => {
  describe("пустой GraphOps", () => {
    it("не создаёт дополнительных узлов и рёбер", () => {
      const ctx = makeCtx()
      applyGraphOps({}, ctx)

      expect([...ctx.graph.nodes()]).toHaveLength(1)
      expect([...ctx.graph.outEdgeEntries(PARENT_NODE_ID)]).toHaveLength(0)
    })

    it("работает с явными пустыми массивами", () => {
      const ctx = makeCtx()
      applyGraphOps({ children: [], references: [] }, ctx)

      expect([...ctx.graph.nodes()]).toHaveLength(1)
      expect([...ctx.graph.outEdgeEntries(PARENT_NODE_ID)]).toHaveLength(0)
    })
  })

  describe("только children", () => {
    it("создаёт child-узел с ребром kind=edgeName", () => {
      const ctx = makeCtx()
      const ops: GraphOps = {
        children: [{ idSuffix: "Валюта", name: "Валюта" }],
      }

      applyGraphOps(ops, ctx)

      const childId = "Catalog.Товары.Цена.Валюта"
      expect(ctx.graph.hasNode(childId)).toBe(true)
      const attrs = ctx.graph.getNodeAttributes(childId)
      expect(attrs.name).toBe("Валюта")
      expect(attrs.filePaths).toEqual(["catalogs/goods.yaml"])

      const edges = [...ctx.graph.outEdgeEntries(PARENT_NODE_ID)]
      expect(edges).toHaveLength(1)
      expect(edges[0].attributes.kind).toBe("TYPE")
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

      expect(ctx.graph.hasNode("Catalog.Товары.Цена.А")).toBe(true)
      expect(ctx.graph.hasNode("Catalog.Товары.Цена.Б")).toBe(true)
      expect([...ctx.graph.outEdgeEntries(PARENT_NODE_ID)]).toHaveLength(2)
    })

    it("ставит index на owning-рёбра children по порядку children", () => {
      const graph = new GraphBuilder()
      graph.ensureNode("P", { name: "P" })

      applyGraphOps(
        {
          children: [
            { idSuffix: "A", name: "A", item: { itemType: "Child", name: "A" } },
            { idSuffix: "B", name: "B", item: { itemType: "Child", name: "B" } },
          ],
        },
        { graph, parentNodeId: "P", filePath: "p.yaml", edgeKind: "VALUE", edgeYaml: "Значение" },
      )

      const edges = [...graph.outEdgeEntries("P")].map((edge) => ({
        target: edge.target,
        index: edge.attributes.index,
      }))

      expect(edges).toEqual([
        { target: "P.A", index: 0 },
        { target: "P.B", index: 1 },
      ])
    })
  })

  describe("только references", () => {
    it("создаёт stub-узел с ребром kind=edgeName", () => {
      const ctx = makeCtx()
      const ops: GraphOps = {
        references: [{ id: "Справочник.Валюты", name: "Валюты" }],
      }

      applyGraphOps(ops, ctx)

      expect(ctx.graph.hasNode("Catalog.Валюты")).toBe(true)
      expect(ctx.graph.hasNode("Справочник.Валюты")).toBe(false)
      const attrs = ctx.graph.getNodeAttributes("Catalog.Валюты")
      expect(attrs.name).toBe("Валюты")
      expect(attrs.filePaths).toEqual([])

      const edges = [...ctx.graph.outEdgeEntries(PARENT_NODE_ID)]
      expect(edges).toHaveLength(1)
      expect(edges[0].attributes.kind).toBe("TYPE")
    })

    it("пробрасывает positionFrom на reference-ребро", () => {
      const ctx = makeCtx()
      const ops: GraphOps = {
        references: [
          {
            id: "Справочник.Валюты",
            name: "Валюты",
            positionFrom: { offset: 100, line: 7, column: 9, length: 20 },
          },
        ],
      }

      applyGraphOps(ops, ctx)

      const edges = [...ctx.graph.outEdgeEntries(PARENT_NODE_ID)]
      expect(edges[0].attributes.positionFrom).toEqual({ offset: 100, line: 7, column: 9, length: 20 })
    })

    it("пробрасывает edgeProps на reference-ребро", () => {
      const ctx = makeCtx()
      const ops: GraphOps = {
        references: [
          {
            id: "Справочник.Валюты",
            name: "Валюты",
            edgeProps: {
              kind: "BROKEN",
              filePath: "wrong.yaml",
              yaml: "Wrong",
              property: "dataPath",
              sourcePath: "Catalog.Валюты",
              pathMode: "global",
            },
          },
        ],
      }

      applyGraphOps(ops, ctx)

      const edges = [...ctx.graph.outEdgeEntries(PARENT_NODE_ID)]
      expect(edges).toHaveLength(1)
      expect(edges[0].attributes).toMatchObject({
        kind: "TYPE",
        yaml: "Тип",
        property: "dataPath",
        sourcePath: "Catalog.Валюты",
        pathMode: "global",
      })
      expect(edges[0].attributes.filePath).toBeUndefined()
    })

    it("ссылка без positionFrom не ставит атрибут на ребро", () => {
      const ctx = makeCtx()
      applyGraphOps({ references: [{ id: "Справочник.Валюты", name: "Валюты" }] }, ctx)

      const edges = [...ctx.graph.outEdgeEntries(PARENT_NODE_ID)]
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

      expect(ctx.graph.hasNode("Catalog.А")).toBe(true)
      expect(ctx.graph.hasNode("Catalog.Б")).toBe(true)
      expect([...ctx.graph.outEdgeEntries(PARENT_NODE_ID)]).toHaveLength(2)
    })
  })

  describe("stub-vs-owned", () => {
    it("не перезаписывает owned-узел при повторном reference", () => {
      const graph = new GraphBuilder()
      const ownedItem = { itemType: "MetadataCatalog", name: "Валюты" }
      ensureNodeWithFile(graph, "Catalog.Валюты", "Валюты", "currencies.yaml")
      graph.setItem("Catalog.Валюты", ownedItem)

      applyGraphOps(
        { references: [{ id: "Справочник.Валюты", name: "Валюты" }] },
        makeCtx({ graph }),
      )

      expect(graph.getNodeAttributes("Catalog.Валюты").item).toBe(ownedItem)
      expect(graph.getNodeAttributes("Catalog.Валюты").filePaths).toEqual(["currencies.yaml"])
    })

    it("stub-узел не получает filePath", () => {
      const ctx = makeCtx()
      applyGraphOps(
        { references: [{ id: "Справочник.Неизвестный", name: "Неизвестный" }] },
        ctx,
      )

      const attrs = ctx.graph.getNodeAttributes("Catalog.Неизвестный")
      expect(attrs.filePaths).toEqual([])
      expect(attrs.item).toBeUndefined()
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

      const edges = [...ctx.graph.outEdgeEntries(PARENT_NODE_ID)]
      expect(edges).toHaveLength(2)
      expect(edges.every((e) => e.attributes.kind === "TYPE")).toBe(true)
    })
  })

  describe("formLocalReferences", () => {
    it("создаёт generic reference-ребро через локальный источник формы", () => {
      const ctx = makeCtx()
      const formNodeId = "Document.Заказ.Form.Форма"
      const attrId = `${formNodeId}.Attribute.Объект`
      const proxyNodeId = `${PARENT_NODE_ID}.Прокси`
      ensureNodeWithFile(ctx.graph, formNodeId, "Форма", FILE_PATH)
      ensureNodeWithFile(ctx.graph, attrId, "Объект", FILE_PATH)
      ensureNodeWithFile(ctx.graph, proxyNodeId, "Прокси", FILE_PATH)
      ctx.graph.ensureEdge(formNodeId, attrId, "FORM_ATTRIBUTE", { yaml: "РеквизитФормы" })
      ctx.graph.ensureNode("Document.Заказ", { name: "Заказ" })
      ctx.graph.ensureEdge(attrId, "Document.Заказ", "TYPE", { yaml: "Тип" })

      applyGraphOps(
        {
          formLocalReferences: [
            {
              formLocalPath: "Объект.Товары",
              formNodeId,
              parentOverride: proxyNodeId,
              fallbackChildKind: "TabularSection",
              edgeProps: { property: "table", sourcePath: "Объект.Товары" },
            },
          ],
        },
        { ...ctx, edgeKind: "TABLE", edgeYaml: "Таблица" },
      )

      const edges = [...ctx.graph.outEdgeEntries(proxyNodeId)]
      expect(edges).toHaveLength(1)
      expect(edges[0].target).toBe("Document.Заказ.TabularSection.Товары")
      expect(edges[0].attributes).toMatchObject({
        kind: "TABLE",
        yaml: "Таблица",
        property: "table",
        sourcePath: "Объект.Товары",
      })
    })
  })

  describe("parentOverride и item", () => {
    it("child.parentOverride меняет childNodeId и источник ребра", () => {
      const ctx = makeCtx()
      const proxyNodeId = `${PARENT_NODE_ID}.Прокси`
      ensureNodeWithFile(ctx.graph, proxyNodeId, "Прокси", FILE_PATH)

      const ops: GraphOps = {
        children: [
          {
            idSuffix: "ДочерняяКолонка",
            name: "ДочерняяКолонка",
            parentOverride: proxyNodeId,
          },
        ],
      }
      applyGraphOps(ops, { ...ctx, edgeKind: "FORM_COLUMN", edgeYaml: "КолонкаФормы" })

      const childNodeId = `${proxyNodeId}.ДочерняяКолонка`
      expect(ctx.graph.hasNode(childNodeId)).toBe(true)

      const edgesFromProxy = [...ctx.graph.outEdgeEntries(proxyNodeId)]
      expect(edgesFromProxy).toHaveLength(1)
      expect(edgesFromProxy[0].target).toBe(childNodeId)
      expect(edgesFromProxy[0].attributes.kind).toBe("FORM_COLUMN")

      expect([...ctx.graph.outEdgeEntries(PARENT_NODE_ID)]).toHaveLength(0)
    })

    it("child.item записывается в node.item", () => {
      const ctx = makeCtx()
      const item = { itemType: "FormAttributeColumn", customField: 42 }

      const ops: GraphOps = {
        children: [{ idSuffix: "Колонка", name: "Колонка", item }],
      }
      applyGraphOps(ops, { ...ctx, edgeKind: "FORM_COLUMN", edgeYaml: "КолонкаФормы" })

      const childNodeId = `${PARENT_NODE_ID}.Колонка`
      expect(ctx.graph.hasNode(childNodeId)).toBe(true)
      expect(ctx.graph.getNodeAttributes(childNodeId).item).toEqual(item)
    })
  })

  describe("absoluteId и edgeFrom", () => {
    it("absoluteId перекрывает построение childNodeId из idSuffix", () => {
      const ctx = makeCtx()
      const ops: GraphOps = {
        children: [{ idSuffix: "НеИспользуется", name: "Кнопка", absoluteId: "X.Y.Z" }],
      }

      applyGraphOps(ops, ctx)

      expect(ctx.graph.hasNode("X.Y.Z")).toBe(true)
      expect(ctx.graph.hasNode(`${PARENT_NODE_ID}.НеИспользуется`)).toBe(false)

      const edges = [...ctx.graph.outEdgeEntries(PARENT_NODE_ID)]
      expect(edges).toHaveLength(1)
      expect(edges[0].target).toBe("X.Y.Z")
    })

    it("edgeFrom перекрывает источник ребра", () => {
      const ctx = makeCtx()
      const edgeFromId = "FORM_NODE"
      ensureNodeWithFile(ctx.graph, edgeFromId, "FORM_NODE", FILE_PATH)

      const ops: GraphOps = {
        children: [{ idSuffix: "Элемент", name: "Элемент", edgeFrom: edgeFromId }],
      }

      applyGraphOps(ops, ctx)

      const childNodeId = `${PARENT_NODE_ID}.Элемент`
      expect(ctx.graph.hasNode(childNodeId)).toBe(true)

      const edgesFromForm = [...ctx.graph.outEdgeEntries(edgeFromId)]
      expect(edgesFromForm).toHaveLength(1)
      expect(edgesFromForm[0].target).toBe(childNodeId)

      expect([...ctx.graph.outEdgeEntries(PARENT_NODE_ID)]).toHaveLength(0)
    })

    it("комбинация absoluteId + edgeFrom", () => {
      const ctx = makeCtx()
      const edgeFromId = "FORM_NODE"
      ensureNodeWithFile(ctx.graph, edgeFromId, "FORM_NODE", FILE_PATH)

      const ops: GraphOps = {
        children: [
          {
            idSuffix: "НеИспользуется",
            name: "Кнопка",
            absoluteId: "FORM_NODE.Элемент.Кнопка",
            edgeFrom: edgeFromId,
          },
        ],
      }

      applyGraphOps(ops, ctx)

      expect(ctx.graph.hasNode("FORM_NODE.Element.Кнопка")).toBe(true)
      expect(ctx.graph.hasNode(`${PARENT_NODE_ID}.НеИспользуется`)).toBe(false)

      const edgesFromForm = [...ctx.graph.outEdgeEntries(edgeFromId)]
      expect(edgesFromForm).toHaveLength(1)
      expect(edgesFromForm[0].target).toBe("FORM_NODE.Element.Кнопка")

      expect([...ctx.graph.outEdgeEntries(PARENT_NODE_ID)]).toHaveLength(0)
    })
  })
})
