// @ts-nocheck
// FIXME(phase-4): тесты на старом MetadataGraph API. Адаптировать на GraphBuilder в Phase 4.
import fs from "fs"
import path from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { nodeMatch } from "~/metadata/relations/dependencyQuery"
import { getDependencies } from "~/metadata/relations/getDependencies"
import { MetadataGraph } from "~/metadata/relations/MetadataGraph"
import { importMetadataFileWithGraph } from "~/metadata/orchestration/importMetadataFileWithGraph"
import { mockContext } from "~/tests/mockContext"
import { importMetadataEnumerationFromYAML } from "./fromYAML"

describe("importMetadataEnumerationFromYAML", () => {
  it("возвращает undefined при отсутствии данных", () => {
    const result = importMetadataEnumerationFromYAML(mockContext, undefined, "СтатусЗаказа")
    expect(result).toBeUndefined()
  })

  it("импортирует без значений", () => {
    const result = importMetadataEnumerationFromYAML(mockContext, {}, "СтатусЗаказа")
    expect(result).toMatchObject({ name: "СтатусЗаказа" })
  })
})

describe("importMetadataEnumerationFromYAML — граф значений", () => {
  let graph: MetadataGraph

  beforeEach(() => {
    graph = new MetadataGraph()
    const text = fs.readFileSync(path.join(__dirname, "__fixtures__/values.yaml"), "utf8")
    importMetadataFileWithGraph({
      filePath: "Перечисление/СтатусЗаказа/Свойства.yml",
      sources: { yaml: text },
      kind: "enumeration",
      name: "СтатусЗаказа",
      graph,
      context: mockContext,
    })
  })

  it("создаёт узел перечисления", () => {
    expect(graph.hasNode("Перечисление.СтатусЗаказа")).toBe(true)
  })

  it("создаёт узел для каждого значения", () => {
    expect(graph.hasNode("Перечисление.СтатусЗаказа.Открыт")).toBe(true)
    expect(graph.hasNode("Перечисление.СтатусЗаказа.Закрыт")).toBe(true)
    expect(graph.hasNode("Перечисление.СтатусЗаказа.Отменён")).toBe(true)
  })

  it("узел значения содержит item с itemType и name", () => {
    const attrs = graph.getNodeAttributes("Перечисление.СтатусЗаказа.Открыт")
    expect(attrs.item).toMatchObject({ itemType: "MetadataEnumerationValue", name: "Открыт" })
  })

  it("узел значения принадлежит правильному файлу", () => {
    const attrs = graph.getNodeAttributes("Перечисление.СтатусЗаказа.Закрыт")
    expect(attrs.filePaths?.[0]).toBe("Перечисление/СтатусЗаказа/Свойства.yml")
  })

  it("значения связаны с перечислением composition-рёбрами", () => {
    const dependencies = getDependencies(
      nodeMatch(({ attrs }) => attrs.name === "Перечисление")
        .nodeMatch(() => true)
        .edgeMatch(({ attrs }) => attrs.kind === "ЗначениеПеречисления"),
      graph,
    )

    expect(Object.keys(dependencies).sort()).toEqual([
      "Перечисление.СтатусЗаказа.Закрыт",
      "Перечисление.СтатусЗаказа.Открыт",
      "Перечисление.СтатусЗаказа.Отменён",
    ])
  })
})

describe("importMetadataEnumerationFromYAML — positionFrom значений", () => {
  let graph: MetadataGraph
  let text: string

  beforeEach(() => {
    graph = new MetadataGraph()
    text = fs.readFileSync(path.join(__dirname, "__fixtures__/values.yaml"), "utf8")
    importMetadataFileWithGraph({
      filePath: "Перечисление/СтатусЗаказа/Свойства.yml",
      sources: { yaml: text },
      kind: "enumeration",
      name: "СтатусЗаказа",
      graph,
      context: mockContext,
    })
  })

  it("узел значения содержит positionFrom с корректным offset", () => {
    const attrs = graph.getNodeAttributes("Перечисление.СтатусЗаказа.Открыт")
    expect(attrs.positionFrom).toMatchObject({ offset: text.indexOf("Открыт") })
  })

  it("positionFrom указывает на корректную позицию второго значения", () => {
    const attrs = graph.getNodeAttributes("Перечисление.СтатусЗаказа.Закрыт")
    expect(attrs.positionFrom).toMatchObject({ offset: text.indexOf("Закрыт") })
  })

  it("positionFrom указывает на корректную позицию третьего значения", () => {
    const attrs = graph.getNodeAttributes("Перечисление.СтатусЗаказа.Отменён")
    expect(attrs.positionFrom).toMatchObject({ offset: text.indexOf("Отменён") })
  })
})
