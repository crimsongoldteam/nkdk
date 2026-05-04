import { describe, expect, it } from "vitest"
import { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
import { walkGraphToFileData } from "~/metadata/orchestration/buildGraph/walkGraphToFileData"
import { buildGraphFromModel } from "~/metadata/orchestration/buildGraphFromModel"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import "./graphFromModel"

const filePath = "Справочник/Товары/Свойства.yaml"
const parentNodeId = "Справочник.Товары.Реквизит.Владелец"

const ownerRule = {
  itemType: "MetadataAttribute",
  properties: {
    name: { type: "string", yaml: "Имя" },
    choiceParameters: { type: "ChoiceParameters", yaml: "ПараметрыВыбора" },
  },
} as const satisfies MetadataItemRule

describe("ChoiceParameters graphFromModel", () => {
  it("создаёт дочерние узлы с index и не дублирует коллекцию в props владельца", () => {
    const graph = new GraphBuilder()
    graph.ensureNode(parentNodeId, {
      name: "Владелец",
      item: {
        itemType: "MetadataAttribute",
        name: "Владелец",
        choiceParameters: [
          { name: "Отбор.Владелец", value: { type: "string", value: "A" } },
          { name: "Отбор.Родитель", value: { type: "boolean", value: true } },
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

    const firstId = `${parentNodeId}.ПараметрВыбора[0]`
    const secondId = `${parentNodeId}.ПараметрВыбора[1]`
    expect(graph.hasNode(firstId)).toBe(true)
    expect(graph.hasNode(secondId)).toBe(true)

    const edges = [...graph.outEdgeEntries(parentNodeId)].filter(
      (edge) => edge.attributes.kind === "CHOICE_PARAMETER",
    )
    expect(edges.map((edge) => ({ target: edge.target, index: edge.attributes.index }))).toEqual([
      { target: firstId, index: 0 },
      { target: secondId, index: 1 },
    ])

    const file = walkGraphToFileData(graph).find((segment) => segment.filePath === filePath)!
    const parent = file.nodes.find((node) => node.id === parentNodeId)!
    const first = file.nodes.find((node) => node.id === firstId)!

    expect(Object.keys(parent.props).some((key) => key.startsWith("p_choiceParameters_"))).toBe(
      false,
    )
    expect(first.label).toBe("ChoiceParameter")
    expect(first.props.name).toBe("Отбор.Владелец")
    expect(first.props.p_value_type).toBe("string")
    expect(first.props.p_value_value).toBe("A")
  })

  it("создаёт VALUE-ребро от ChoiceParameter для ссылочного MetadataValue", () => {
    const graph = new GraphBuilder()
    graph.ensureNode(parentNodeId, {
      name: "Владелец",
      item: {
        itemType: "MetadataAttribute",
        name: "Владелец",
        choiceParameters: [
          {
            name: "Отбор.Ссылка",
            value: { type: "ref", value: "Catalog.Товары.EmptyRef" },
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

    const choiceNodeId = `${parentNodeId}.ПараметрВыбора[0]`
    const valueEdge = [...graph.outEdgeEntries(choiceNodeId)].find(
      (edge) => edge.attributes.kind === "VALUE",
    )
    expect(valueEdge?.target).toBe("Справочник.Товары.ПустаяСсылка")
  })

  it("поддерживает YAML-словарь параметров выбора и не выгружает его в props владельца", () => {
    const graph = new GraphBuilder()
    graph.ensureNode(parentNodeId, {
      name: "Владелец",
      item: {
        itemType: "MetadataAttribute",
        name: "Владелец",
        choiceParameters: {
          "Отбор.Владелец": { type: "string", value: "A" },
          "Отбор.Пустой": null,
        },
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

    const file = walkGraphToFileData(graph).find((segment) => segment.filePath === filePath)!
    const parent = file.nodes.find((node) => node.id === parentNodeId)!
    const first = file.nodes.find((node) => node.id === `${parentNodeId}.ПараметрВыбора[0]`)!
    const second = file.nodes.find((node) => node.id === `${parentNodeId}.ПараметрВыбора[1]`)!

    expect(Object.keys(parent.props).some((key) => key.startsWith("p_choiceParameters_"))).toBe(
      false,
    )
    expect(first.props.name).toBe("Отбор.Владелец")
    expect(first.props.p_value_type).toBe("string")
    expect(first.props.p_value_value).toBe("A")
    expect(second.props.name).toBe("Отбор.Пустой")
    expect(Object.keys(second.props).some((key) => key.startsWith("p_value"))).toBe(false)
  })
})
