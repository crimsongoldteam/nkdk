import fs from "fs"
import path from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
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
  let graph: GraphBuilder

  beforeEach(() => {
    graph = new GraphBuilder()
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
    expect(attrs.filePaths[0]).toBe("Перечисление/СтатусЗаказа/Свойства.yml")
  })

  it("значения связаны с перечислением composition-рёбрами", () => {
    // Заменяем getDependencies-DSL на прямой обход рёбер через outEdgeEntries
    const valueEdges = [...graph.outEdgeEntries("Перечисление.СтатусЗаказа")].filter(
      (e) => e.attributes.kind === "ЗначениеПеречисления",
    )
    const valueNodeIds = valueEdges.map((e) => e.target).sort()

    expect(valueNodeIds).toEqual([
      "Перечисление.СтатусЗаказа.Закрыт",
      "Перечисление.СтатусЗаказа.Открыт",
      "Перечисление.СтатусЗаказа.Отменён",
    ])
  })
})
