import { describe, expect, it } from "vitest"
import { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
import { walkGraphToFileData } from "~/metadata/orchestration/buildGraph/walkGraphToFileData"
import { buildGraphFromModel } from "~/metadata/orchestration/buildGraphFromModel"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import "./graphFromModel"

const filePath = "Справочник/Товары/Свойства.yaml"
const parentNodeId = "Catalog.Товары.Attribute.Характеристика"

const ownerRule = {
  itemType: "MetadataAttribute",
  properties: {
    name: { type: "string", yaml: "Имя" },
    choiceParameterLinks: { type: "ChoiceParameterLinks", yaml: "СвязиПараметровВыбора" },
  },
} as const satisfies MetadataItemRule

describe("ChoiceParameterLinks graphFromModel", () => {
  it("создаёт дочерние узлы с index и не дублирует коллекцию в props владельца", () => {
    const graph = new GraphBuilder()
    graph.ensureNode(parentNodeId, {
      name: "Характеристика",
      item: {
        itemType: "MetadataAttribute",
        name: "Характеристика",
        choiceParameterLinks: [
          {
            name: "Отбор.Владелец",
            dataPath: "Catalog.Товары.Attribute.Владелец",
            valueChange: "DontChange",
          },
          {
            name: "Отбор.Родитель",
            dataPath: "Catalog.Товары.StandardAttribute.Parent",
          },
        ],
      },
    })
    graph.addFilePath(parentNodeId, filePath)

    buildGraphFromModel({
      model: graph.getNodeAttributes(parentNodeId).item as Record<string, unknown>,
      yamlMap: undefined,
      rule: ownerRule,
      graph,
      parentNodeId,
      filePath,
    })

    const firstId = `${parentNodeId}.СвязьПараметровВыбора[0]`
    const secondId = `${parentNodeId}.СвязьПараметровВыбора[1]`
    expect(graph.hasNode(firstId)).toBe(true)
    expect(graph.hasNode(secondId)).toBe(true)

    const edges = [...graph.outEdgeEntries(parentNodeId)].filter(
      (edge) => edge.attributes.kind === "CHOICE_PARAMETER_LINK",
    )
    expect(edges.map((edge) => ({ target: edge.target, index: edge.attributes.index }))).toEqual([
      { target: firstId, index: 0 },
      { target: secondId, index: 1 },
    ])

    const file = walkGraphToFileData(graph).find((segment) => segment.filePath === filePath)!
    const parent = file.nodes.find((node) => node.id === parentNodeId)!
    const first = file.nodes.find((node) => node.id === firstId)!

    expect(Object.keys(parent.props).some((key) => key.startsWith("p_choiceParameterLinks_"))).toBe(
      false,
    )
    expect(first.label).toBe("ChoiceParameterLink")
    expect(first.props.name).toBe("Отбор.Владелец")
    expect(first.props.p_dataPath).toBe("Catalog.Товары.Attribute.Владелец")
    expect(first.props.p_valueChange).toBe("DontChange")
  })

  it("не добавляет синтетическое поле dataPathReference в props ChoiceParameterLink", () => {
    const graph = new GraphBuilder()
    graph.ensureNode(parentNodeId, {
      name: "Характеристика",
      item: {
        itemType: "MetadataAttribute",
        name: "Характеристика",
        choiceParameterLinks: [
          { name: "Отбор.Владелец", dataPath: "Catalog.Товары.Attribute.Владелец" },
        ],
      },
    })
    graph.addFilePath(parentNodeId, filePath)

    buildGraphFromModel({
      model: graph.getNodeAttributes(parentNodeId).item as Record<string, unknown>,
      yamlMap: undefined,
      rule: ownerRule,
      graph,
      parentNodeId,
      filePath,
    })

    const linkNodeId = `${parentNodeId}.СвязьПараметровВыбора[0]`
    const file = walkGraphToFileData(graph).find((segment) => segment.filePath === filePath)!
    const link = file.nodes.find((node) => node.id === linkNodeId)!

    expect(Object.keys(link.props).some((key) => key.includes("dataPathReference"))).toBe(false)
  })
})
