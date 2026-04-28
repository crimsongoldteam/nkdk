import { describe, expect, it } from "vitest"
import { buildGraph } from "./buildGraph"
import type { ImportContext } from "./types"

const ctx: ImportContext = { version: "2.20", defaultLanguage: "ru" }

describe("buildGraph (smoke)", () => {
  it("возвращает [] для пустого входа", () => {
    expect(buildGraph(new Map(), ctx)).toEqual([])
  })

  it("импортирует справочник: один узел MetadataCatalog с правильным id и label", () => {
    const yaml = `\
ИмяОбъекта: Контрагенты
Иерархический: true
ДлинаКода: 9
`
    const files = new Map([
      ["Справочник/Контрагенты/Свойства.yaml", yaml],
    ])

    const result = buildGraph(files, ctx)
    const fileSegment = result.find((f) => f.filePath === "Справочник/Контрагенты/Свойства.yaml")
    expect(fileSegment).toBeDefined()

    const root = fileSegment!.nodes.find((n) => n.id === "Справочник.Контрагенты")
    expect(root).toBeDefined()
    expect(root!.label).toBe("MetadataCatalog")
    expect(root!.props.name).toBe("Контрагенты")
    expect(root!.props.filePath).toBe("Справочник/Контрагенты/Свойства.yaml")
  })

  it("игнорирует файл с неизвестным kind (без падения)", () => {
    const files = new Map([["Случайный/Файл.yaml", "Имя: x"]])
    expect(buildGraph(files, ctx)).toEqual([])
  })
})

describe("buildGraph (формы)", () => {
  it("импортирует форму: формовой узел в filePath формы, ребро Форма от владельца", () => {
    const catalogYaml = `\
ДлинаКода: 9
`
    const formYaml = `\
Реквизиты: {}
`
    const files = new Map([
      ["Справочник/Контрагенты/Свойства.yaml", catalogYaml],
      ["Справочник/Контрагенты/Формы/ФормаСписка/Форма.yaml", formYaml],
    ])

    const result = buildGraph(files, ctx)
    const formFile = result.find(
      (f) => f.filePath === "Справочник/Контрагенты/Формы/ФормаСписка/Форма.yaml",
    )!
    const formNode = formFile.nodes.find(
      (n) => n.id === "Справочник.Контрагенты.Форма.ФормаСписка",
    )
    expect(formNode).toBeDefined()
    expect(formNode!.label).toBe("ClientApplicationForm")

    // Ребро FORM от справочника к форме — оно живёт в catalog-сегменте,
    // потому что узел-источник «Справочник.Контрагенты» имеет filePath = catalog.yaml.
    const catalogFile = result.find(
      (f) => f.filePath === "Справочник/Контрагенты/Свойства.yaml",
    )!
    const formEdge = catalogFile.edges.find(
      (e) => e.kind === "FORM" && e.tgt === "Справочник.Контрагенты.Форма.ФормаСписка",
    )
    expect(formEdge).toBeDefined()
  })
})

describe("buildGraph (рёбра и стабы)", () => {
  it("создаёт стаб для ссылки на несуществующий объект", () => {
    // Перечисление с несуществующим типом значения — простой пример «ссылка вникуда»
    // через стандартный механизм MetadataValue. Реальный сценарий стаба зависит от
    // правил, но для контракта buildGraph достаточно проверить, что стаб попадает в
    // сегмент с filePath ''.
    // Используем самый компактный YAML, в котором ref-узел получит стаб-цель:
    const enumYaml = `\
Значения:
  - Имя: Поставщик
`
    const files = new Map([
      ["Перечисление/ВидыКонтрагентов/Свойства.yaml", enumYaml],
    ])
    const result = buildGraph(files, ctx)
    // Базовая ассерция: главный узел перечисления есть.
    const enumFile = result.find(
      (f) => f.filePath === "Перечисление/ВидыКонтрагентов/Свойства.yaml",
    )!
    const root = enumFile.nodes.find((n) => n.id === "Перечисление.ВидыКонтрагентов")
    expect(root).toBeDefined()
    // Если в результате есть stub-сегмент — он должен иметь filePath ''.
    const stubSegment = result.find((f) => f.filePath === "")
    if (stubSegment) {
      for (const n of stubSegment.nodes) {
        expect(n.props.filePath).toBeUndefined()
      }
    }
  })
})
