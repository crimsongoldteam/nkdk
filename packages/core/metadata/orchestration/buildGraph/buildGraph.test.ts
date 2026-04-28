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
