import fs from "fs"
import path from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
import { importMetadataFileWithGraph } from "~/metadata/orchestration/importMetadataFileWithGraph"
import { testExportAppliedObjectToYAML } from "~/tests/appliedObject"
import { mockContext } from "~/tests/mockContext"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import { importMetadataEnumerationFromYAML } from "./fromYAML"
import { MetadataEnumerationRules } from "./rules"

describe("import MetadataEnumeration from YAML", () => {
  it("imports undefined", () => {
    const result = importMetadataEnumerationFromYAML(mockContext, undefined, "СтатусЗаказа")
    expect(result).toBeUndefined()
  })

  it("imports full fixture", () => {
    const result = importMetadataEnumerationFromYAML(mockContext, fullYAML, "ПеречислениеВсеСвойства")
    expect(result).toEqual(full)
  })

  it("imports minimal fixture", () => {
    const result = importMetadataEnumerationFromYAML(mockContext, minimalYAML, "ПеречислениеПоУмолчанию")
    expect(result).toEqual(minimal)
  })

  it("round-trip: full — import затем export даёт тот же YAML (parsed)", () => {
    const imported = importMetadataEnumerationFromYAML(mockContext, fullYAML, "ПеречислениеВсеСвойства")
    const exported = testExportAppliedObjectToYAML({
      rule: MetadataEnumerationRules,
      data: imported,
    })
    expect(exported).toEqual(fullYAML)
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
    expect(graph.hasNode("Enum.СтатусЗаказа")).toBe(true)
  })

  it("создаёт узел для каждого значения", () => {
    expect(graph.hasNode("Enum.СтатусЗаказа.Открыт")).toBe(true)
    expect(graph.hasNode("Enum.СтатусЗаказа.Закрыт")).toBe(true)
    expect(graph.hasNode("Enum.СтатусЗаказа.Отменён")).toBe(true)
  })

  it("узел значения содержит item с itemType и name", () => {
    const attrs = graph.getNodeAttributes("Enum.СтатусЗаказа.Открыт")
    expect(attrs.item).toMatchObject({ itemType: "MetadataEnumerationValue", name: "Открыт" })
  })

  it("узел значения принадлежит правильному файлу", () => {
    const attrs = graph.getNodeAttributes("Enum.СтатусЗаказа.Закрыт")
    expect(attrs.filePaths[0]).toBe("Перечисление/СтатусЗаказа/Свойства.yml")
  })

  it("значения связаны с перечислением composition-рёбрами", () => {
    // Заменяем getDependencies-DSL на прямой обход рёбер через outEdgeEntries
    const valueEdges = [...graph.outEdgeEntries("Enum.СтатусЗаказа")].filter(
      (e) => e.attributes.kind === "ENUM_VALUE",
    )
    const valueNodeIds = valueEdges.map((e) => e.target).sort()

    expect(valueNodeIds).toEqual([
      "Enum.СтатусЗаказа.Закрыт",
      "Enum.СтатусЗаказа.Открыт",
      "Enum.СтатусЗаказа.Отменён",
    ])
    expect(valueEdges.map((e) => e.attributes.yaml)).toEqual([
      "ЗначениеПеречисления",
      "ЗначениеПеречисления",
      "ЗначениеПеречисления",
    ])
  })

  it("стандартный реквизит перечисления содержит item из YAML", () => {
    const graph = new GraphBuilder()
    importMetadataFileWithGraph({
      filePath: "Перечисление/СтатусЗаказа/Свойства.yml",
      sources: {
        yaml: [
          "СтандартныеРеквизиты:",
          "  Порядок:",
          "    Синоним: Другой синоним порядок",
        ].join("\n"),
      },
      kind: "enumeration",
      name: "СтатусЗаказа",
      graph,
      context: mockContext,
    })

    const attrs = graph.getNodeAttributes("Enum.СтатусЗаказа.StandardAttribute.Порядок")
    expect(attrs.item).toMatchObject({
      itemType: "StandardAttributeDescription",
      name: "Order",
      synonym: { items: { ru: "Другой синоним порядок" } },
    })
  })
})
