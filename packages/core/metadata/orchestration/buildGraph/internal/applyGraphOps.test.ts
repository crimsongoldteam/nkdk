import { describe, expect, it } from "vitest"
import { GraphOps } from "~/metadata/orchestration/property/fn"
import { applyGraphOps, ApplyGraphOpsContext } from "./applyGraphOps"
import { GraphBuilder } from "./GraphBuilder"

const PARENT_NODE_ID = "Справочник.Товары.Цена"
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

      const childId = "Справочник.Товары.Цена.Валюта"
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

      expect(ctx.graph.hasNode("Справочник.Товары.Цена.А")).toBe(true)
      expect(ctx.graph.hasNode("Справочник.Товары.Цена.Б")).toBe(true)
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

      expect(ctx.graph.hasNode("Справочник.Валюты")).toBe(true)
      const attrs = ctx.graph.getNodeAttributes("Справочник.Валюты")
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

      expect(ctx.graph.hasNode("Справочник.А")).toBe(true)
      expect(ctx.graph.hasNode("Справочник.Б")).toBe(true)
      expect([...ctx.graph.outEdgeEntries(PARENT_NODE_ID)]).toHaveLength(2)
    })
  })

  describe("stub-vs-owned", () => {
    it("не перезаписывает owned-узел при повторном reference", () => {
      const graph = new GraphBuilder()
      const ownedItem = { itemType: "MetadataCatalog", name: "Валюты" }
      ensureNodeWithFile(graph, "Справочник.Валюты", "Валюты", "currencies.yaml")
      graph.setItem("Справочник.Валюты", ownedItem)

      applyGraphOps(
        { references: [{ id: "Справочник.Валюты", name: "Валюты" }] },
        makeCtx({ graph }),
      )

      expect(graph.getNodeAttributes("Справочник.Валюты").item).toBe(ownedItem)
      expect(graph.getNodeAttributes("Справочник.Валюты").filePaths).toEqual(["currencies.yaml"])
    })

    it("stub-узел не получает filePath", () => {
      const ctx = makeCtx()
      applyGraphOps(
        { references: [{ id: "Справочник.Неизвестный", name: "Неизвестный" }] },
        ctx,
      )

      const attrs = ctx.graph.getNodeAttributes("Справочник.Неизвестный")
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
    function makeFormGraph() {
      const graph = new GraphBuilder()
      const formNodeId = "Форма.ТестоваяФорма"
      const attrId = `${formNodeId}.Реквизит.Объект`
      ensureNodeWithFile(graph, formNodeId, "ТестоваяФорма", "test/Форма.yaml")
      ensureNodeWithFile(graph, attrId, "Объект", "test/Форма.yaml")
      graph.ensureEdge(formNodeId, attrId, "FORM_ATTRIBUTE", { yaml: "РеквизитФормы" })
      return { graph, formNodeId, attrId }
    }

    it("создаёт ребро на резолвимую цель (happy path)", () => {
      const { graph, formNodeId, attrId } = makeFormGraph()
      const elementId = `${formNodeId}.Элемент.Кнопка`
      ensureNodeWithFile(graph, elementId, "Кнопка", "test/Форма.yaml")

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

    it("пробрасывает edgeProps на formLocalReferences-ребро", () => {
      const { graph, formNodeId, attrId } = makeFormGraph()
      const elementId = `${formNodeId}.Элемент.Кнопка`
      ensureNodeWithFile(graph, elementId, "Кнопка", "test/Форма.yaml")

      const ctx: ApplyGraphOpsContext = {
        graph,
        parentNodeId: elementId,
        filePath: "test/Форма.yaml",
        edgeKind: "DATA_PATH",
        edgeYaml: "ПутьКДанным",
      }
      const ops: GraphOps = {
        formLocalReferences: [
          {
            formLocalPath: "Объект",
            formNodeId,
            edgeProps: {
              kind: "BROKEN",
              filePath: "wrong.yaml",
              yaml: "Wrong",
              property: "dataPath",
              sourcePath: "Объект",
              pathMode: "formLocal",
            },
          },
        ],
      }

      applyGraphOps(ops, ctx)

      const edges = [...graph.outEdgeEntries(elementId)]
      expect(edges).toHaveLength(1)
      expect(edges[0].target).toBe(attrId)
      expect(edges[0].attributes).toMatchObject({
        kind: "DATA_PATH",
        yaml: "ПутьКДанным",
        property: "dataPath",
        sourcePath: "Объект",
        pathMode: "formLocal",
      })
      expect(edges[0].attributes.filePath).toBeUndefined()
    })

    it("не создаёт ребро, если resolveFormLocalPath вернул undefined (нет первого сегмента)", () => {
      const { graph, formNodeId } = makeFormGraph()
      const elementId = `${formNodeId}.Элемент.Кнопка`
      ensureNodeWithFile(graph, elementId, "Кнопка", "test/Форма.yaml")

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

      expect([...graph.outEdgeEntries(elementId)]).toHaveLength(0)
    })

    it("пробрасывает positionFrom на ребро", () => {
      const { graph, formNodeId } = makeFormGraph()
      const elementId = `${formNodeId}.Элемент.Кнопка`
      ensureNodeWithFile(graph, elementId, "Кнопка", "test/Форма.yaml")

      const ctx: ApplyGraphOpsContext = {
        graph,
        parentNodeId: elementId,
        filePath: "test/Форма.yaml",
        edgeKind: "DATA_PATH",
        edgeYaml: "ПутьКДанным",
      }
      const ops: GraphOps = {
        formLocalReferences: [
          { formLocalPath: "Объект", formNodeId, positionFrom: { offset: 42, line: 3, column: 4 } },
        ],
      }
      applyGraphOps(ops, ctx)

      const edges = [...graph.outEdgeEntries(elementId)]
      expect(edges).toHaveLength(1)
      expect(edges[0].attributes.positionFrom).toEqual({ offset: 42, line: 3, column: 4 })
    })

    it("пустой formLocalReferences не создаёт рёбер", () => {
      const { graph, formNodeId } = makeFormGraph()
      const elementId = `${formNodeId}.Элемент.Кнопка`
      ensureNodeWithFile(graph, elementId, "Кнопка", "test/Форма.yaml")

      const ctx: ApplyGraphOpsContext = {
        graph,
        parentNodeId: elementId,
        filePath: "test/Форма.yaml",
        edgeKind: "DATA_PATH",
        edgeYaml: "ПутьКДанным",
      }
      applyGraphOps({ formLocalReferences: [] }, ctx)

      expect([...graph.outEdgeEntries(elementId)]).toHaveLength(0)
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

    it("formLocalReferences.parentOverride меняет источник ребра", () => {
      const ctx = makeCtx()
      const formNodeId = "Форма.ТестоваяФорма"
      const attrId = `${formNodeId}.Реквизит.Объект`
      ensureNodeWithFile(ctx.graph, formNodeId, "ТестоваяФорма", FILE_PATH)
      ensureNodeWithFile(ctx.graph, attrId, "Объект", FILE_PATH)
      ctx.graph.ensureEdge(formNodeId, attrId, "FORM_ATTRIBUTE", { yaml: "РеквизитФормы" })

      const proxyNodeId = `${PARENT_NODE_ID}.Прокси`
      ensureNodeWithFile(ctx.graph, proxyNodeId, "Прокси", FILE_PATH)

      const ops: GraphOps = {
        formLocalReferences: [
          { formLocalPath: "Объект", formNodeId, parentOverride: proxyNodeId },
        ],
      }
      applyGraphOps(ops, { ...ctx, edgeKind: "TABLE", edgeYaml: "Таблица" })

      const edgesFromProxy = [...ctx.graph.outEdgeEntries(proxyNodeId)]
      expect(edgesFromProxy).toHaveLength(1)
      expect(edgesFromProxy[0].target).toBe(attrId)
      expect(edgesFromProxy[0].attributes.kind).toBe("TABLE")

      const tableEdges = [...ctx.graph.outEdgeEntries(PARENT_NODE_ID)].filter(
        (e) => e.attributes.kind === "TABLE",
      )
      expect(tableEdges).toHaveLength(0)
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

      expect(ctx.graph.hasNode("FORM_NODE.Элемент.Кнопка")).toBe(true)
      expect(ctx.graph.hasNode(`${PARENT_NODE_ID}.НеИспользуется`)).toBe(false)

      const edgesFromForm = [...ctx.graph.outEdgeEntries(edgeFromId)]
      expect(edgesFromForm).toHaveLength(1)
      expect(edgesFromForm[0].target).toBe("FORM_NODE.Элемент.Кнопка")

      expect([...ctx.graph.outEdgeEntries(PARENT_NODE_ID)]).toHaveLength(0)
    })
  })
})
