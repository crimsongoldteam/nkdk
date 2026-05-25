import { describe, expect, it } from "vitest"
import { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
import { walkGraphToFileData } from "~/metadata/orchestration/buildGraph/walkGraphToFileData"
import { importMetadataFileWithGraph } from "~/metadata/orchestration/importMetadataFileWithGraph"
import { extractTypeDescriptionGraph } from "./graphFromModel"
import { TypeDescription } from "./types"

// Активирует регистрации side-effect (registerTypeRule)
import "./graphFromModel"

// ---------------------------------------------------------------------------
// extractTypeDescriptionGraph — табличные тесты
// ---------------------------------------------------------------------------

describe("extractTypeDescriptionGraph", () => {
  it("CatalogRef → ссылка на Catalog.X", () => {
    const model: TypeDescription = { type: ["CatalogRef.Товары"] }
    const result = extractTypeDescriptionGraph(model)
    const refs = result?.references ?? []
    expect(refs).toHaveLength(1)
    expect(refs[0].id).toBe("Catalog.Товары")
    expect(refs[0].name).toBe("Товары")
  })

  it("DocumentRef → ссылка на Document.X", () => {
    const model: TypeDescription = { type: ["DocumentRef.Накладная"] }
    const refs = extractTypeDescriptionGraph(model)?.references ?? []
    expect(refs).toHaveLength(1)
    expect(refs[0].id).toBe("Document.Накладная")
  })

  it("EnumRef → ссылка на Enum.X", () => {
    const model: TypeDescription = { type: ["EnumRef.Статус"] }
    const refs = extractTypeDescriptionGraph(model)?.references ?? []
    expect(refs).toHaveLength(1)
    expect(refs[0].id).toBe("Enum.Статус")
  })

  it("DefinedType (typeset) → ссылка на DefinedType.X", () => {
    const model: TypeDescription = { type: ["DefinedType.МойТип"] }
    const refs = extractTypeDescriptionGraph(model)?.references ?? []
    expect(refs).toHaveLength(1)
    expect(refs[0].id).toBe("DefinedType.МойТип")
  })

  it.each([
    ["DefinedType.ДенежнаяСумма", "DefinedType.ДенежнаяСумма"],
    ["CatalogObject.Номенклатура", "Catalog.Номенклатура"],
    ["DocumentObject.Заказ", "Document.Заказ"],
    ["ChartOfAccountsRef.Хозрасчетный", "ChartOfAccounts.Хозрасчетный"],
  ])("канонизирует TYPE target %s", (sourceType, expectedId) => {
    const model: TypeDescription = { type: [sourceType] }
    const refs = extractTypeDescriptionGraph(model)?.references ?? []
    expect(refs).toHaveLength(1)
    expect(refs[0].id).toBe(expectedId)
  })

  it("несколько типов → несколько ссылок", () => {
    const model: TypeDescription = {
      type: ["CatalogRef.Товары", "DocumentRef.Накладная", "EnumRef.Статус"],
    }
    const refs = extractTypeDescriptionGraph(model)?.references ?? []
    expect(refs).toHaveLength(3)
    const ids = refs.map((r) => r.id)
    expect(ids).toContain("Catalog.Товары")
    expect(ids).toContain("Document.Накладная")
    expect(ids).toContain("Enum.Статус")
  })

  it("пустой массив типов → undefined", () => {
    const model: TypeDescription = { type: [] }
    expect(extractTypeDescriptionGraph(model)).toBeUndefined()
  })

  it("примитив без точки (string) → undefined", () => {
    const model: TypeDescription = { type: ["string"] }
    expect(extractTypeDescriptionGraph(model)).toBeUndefined()
  })

  it("простой тип DynamicList → undefined", () => {
    const model: TypeDescription = { type: ["DynamicList"] }
    expect(extractTypeDescriptionGraph(model)).toBeUndefined()
  })

  it("тип alwaysType (ReportObject.X) → undefined", () => {
    const model: TypeDescription = { type: ["ReportObject.Отчёт"] }
    expect(extractTypeDescriptionGraph(model)).toBeUndefined()
  })

  it("тип без modifier (Null.X) → undefined", () => {
    const model: TypeDescription = { type: ["Null.Что-то"] }
    expect(extractTypeDescriptionGraph(model)).toBeUndefined()
  })

  it("неизвестный базовый тип → undefined", () => {
    const model: TypeDescription = { type: ["НеизвестныйТип.X"] }
    expect(extractTypeDescriptionGraph(model)).toBeUndefined()
  })

  it("смесь: примитив + CatalogRef → только одна ссылка", () => {
    const model: TypeDescription = { type: ["string", "CatalogRef.Контрагенты"] }
    const refs = extractTypeDescriptionGraph(model)?.references ?? []
    expect(refs).toHaveLength(1)
    expect(refs[0].id).toBe("Catalog.Контрагенты")
  })

  it("position пробрасывается в каждую ссылку", () => {
    const model: TypeDescription = {
      type: ["CatalogRef.А", "DocumentRef.Б"],
    }
    const pos = { offset: 42, line: 4, column: 9, length: 10 }
    const refs = extractTypeDescriptionGraph(model, pos)?.references ?? []
    expect(refs).toHaveLength(2)
    for (const ref of refs) {
      expect(ref.positionFrom).toEqual(pos)
    }
  })
})

// ---------------------------------------------------------------------------
// Интеграционный тест: kind рёбра = "Тип" (правило yaml-name, PRD #114)
// ---------------------------------------------------------------------------

const baseContext = { version: "2.20", defaultLanguage: "ru" }
const FILE_PATH = "test/ТипОписание.yaml"

describe("extractTypeDescriptionGraph — интеграция с importMetadataFileWithGraph", () => {
  it("реквизит с Тип: Справочник.X → ребро kind «Тип» от узла реквизита", () => {
    const graph = new GraphBuilder()
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: {
        yaml: `
Реквизиты:
  Контрагент:
    Тип: Справочник.Контрагенты
`,
      },
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    const attrNodeId = "Catalog.Товары.Attribute.Контрагент"
    expect(graph.hasNode(attrNodeId)).toBe(true)

    const typeEdges = [...graph.outEdgeEntries(attrNodeId)].filter(
      (e) => e.attributes.kind === "TYPE"
    )
    expect(typeEdges).toHaveLength(1)
    expect(typeEdges[0].target).toBe("Catalog.Контрагенты")
  })

  it("реквизит с несколькими типами → несколько рёбер kind «Тип»", () => {
    const graph = new GraphBuilder()
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: {
        yaml: `
Реквизиты:
  Объект:
    Тип:
      - Справочник.Контрагенты
      - Документ.Накладная
`,
      },
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    const attrNodeId = "Catalog.Товары.Attribute.Объект"
    const typeEdges = [...graph.outEdgeEntries(attrNodeId)].filter(
      (e) => e.attributes.kind === "TYPE"
    )
    expect(typeEdges).toHaveLength(2)
    const targets = typeEdges.map((e) => e.target).sort()
    expect(targets).toEqual(["Catalog.Контрагенты", "Document.Накладная"])
  })

  it("реквизит формы с Тип: DynamicList хранит тип в props и не создаёт VALUE_TYPE-ребро", () => {
    const graph = new GraphBuilder()
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: {
        yaml: `
Реквизиты:
  Список:
    Тип: DynamicList
`,
      },
      kind: "form",
      name: "ФормаВыбора",
      graph,
      context: baseContext,
      ownerNodeId: "Catalog.Товары",
    })

    const attrNodeId = "Catalog.Товары.Form.ФормаВыбора.Attribute.Список"
    expect(graph.hasNode(attrNodeId)).toBe(true)

    const valueTypeEdges = [...graph.outEdgeEntries(attrNodeId)].filter(
      (e) => e.attributes.kind === "VALUE_TYPE"
    )
    expect(valueTypeEdges).toHaveLength(0)

    const fileGraphData = walkGraphToFileData(graph)
    const segment = fileGraphData.find((item) => item.declaredNodeIds?.includes(attrNodeId))
    const attrNode = segment?.nodes.find((node) => node.id === attrNodeId)

    expect(attrNode?.label).toBe("FormAttribute")
    expect(attrNode?.props.p_type_type).toEqual(["DynamicList"])
  })
})
