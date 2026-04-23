import { describe, expect, it } from "vitest"
import { MetadataGraph } from "~/metadata/relations/MetadataGraph"
import { importMetadataFileWithGraph } from "~/metadata/orchestration/importMetadataFileWithGraph"
import { extractTypeDescriptionGraph } from "./graphFromModel"
import { TypeDescription } from "./types"

// Активирует регистрации side-effect (registerTypeRule)
import "./graphFromModel"

// ---------------------------------------------------------------------------
// extractTypeDescriptionGraph — табличные тесты
// ---------------------------------------------------------------------------

describe("extractTypeDescriptionGraph", () => {
  it("CatalogRef → ссылка на Справочник.X", () => {
    const model: TypeDescription = { type: ["CatalogRef.Товары"] }
    const result = extractTypeDescriptionGraph(model)
    const refs = result?.references ?? []
    expect(refs).toHaveLength(1)
    expect(refs[0].id).toBe("Справочник.Товары")
    expect(refs[0].name).toBe("Товары")
  })

  it("DocumentRef → ссылка на Документ.X", () => {
    const model: TypeDescription = { type: ["DocumentRef.Накладная"] }
    const refs = extractTypeDescriptionGraph(model)?.references ?? []
    expect(refs).toHaveLength(1)
    expect(refs[0].id).toBe("Документ.Накладная")
  })

  it("EnumRef → ссылка на Перечисление.X", () => {
    const model: TypeDescription = { type: ["EnumRef.Статус"] }
    const refs = extractTypeDescriptionGraph(model)?.references ?? []
    expect(refs).toHaveLength(1)
    expect(refs[0].id).toBe("Перечисление.Статус")
  })

  it("DefinedType (typeset) → ссылка на ОпределяемыйТип.X", () => {
    const model: TypeDescription = { type: ["DefinedType.МойТип"] }
    const refs = extractTypeDescriptionGraph(model)?.references ?? []
    expect(refs).toHaveLength(1)
    expect(refs[0].id).toBe("ОпределяемыйТип.МойТип")
  })

  it("несколько типов → несколько ссылок", () => {
    const model: TypeDescription = {
      type: ["CatalogRef.Товары", "DocumentRef.Накладная", "EnumRef.Статус"],
    }
    const refs = extractTypeDescriptionGraph(model)?.references ?? []
    expect(refs).toHaveLength(3)
    const ids = refs.map((r) => r.id)
    expect(ids).toContain("Справочник.Товары")
    expect(ids).toContain("Документ.Накладная")
    expect(ids).toContain("Перечисление.Статус")
  })

  it("пустой массив типов → undefined", () => {
    const model: TypeDescription = { type: [] }
    expect(extractTypeDescriptionGraph(model)).toBeUndefined()
  })

  it("примитив без точки (string) → undefined", () => {
    const model: TypeDescription = { type: ["string"] }
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
    expect(refs[0].id).toBe("Справочник.Контрагенты")
  })

  it("position пробрасывается в каждую ссылку", () => {
    const model: TypeDescription = {
      type: ["CatalogRef.А", "DocumentRef.Б"],
    }
    const pos = { offset: 42, length: 10 }
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
    const graph = new MetadataGraph()
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

    const attrNodeId = "Справочник.Товары.Реквизит.Контрагент"
    expect(graph.hasNode(attrNodeId)).toBe(true)

    const typeEdges = [...graph.outEdgeEntries(attrNodeId)].filter(
      (e) => e.attributes.kind === "Тип"
    )
    expect(typeEdges).toHaveLength(1)
    expect(typeEdges[0].target).toBe("Справочник.Контрагенты")
  })

  it("реквизит с несколькими типами → несколько рёбер kind «Тип»", () => {
    const graph = new MetadataGraph()
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

    const attrNodeId = "Справочник.Товары.Реквизит.Объект"
    const typeEdges = [...graph.outEdgeEntries(attrNodeId)].filter(
      (e) => e.attributes.kind === "Тип"
    )
    expect(typeEdges).toHaveLength(2)
    const targets = typeEdges.map((e) => e.target).sort()
    expect(targets).toEqual(["Документ.Накладная", "Справочник.Контрагенты"])
  })
})
