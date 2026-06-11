import { describe, expect, it } from "vitest"
import { buildGraphFromModel } from "./buildGraphFromModel"
import { GraphBuilder } from "./buildGraph/internal/GraphBuilder"
import { walkGraphToFileData } from "./buildGraph/walkGraphToFileData"
import type { MetadataItemRule } from "./property/types"

import "~/metadata/commonObjects/сhoiceParameterLinks/graphFromModel"

describe("buildGraphFromModel", () => {
  it("не дублирует свойство с buildGraphFromModel в props родительского узла", () => {
    const graph = new GraphBuilder()
    const parentNodeId = "Catalog.Товары.Attribute.Характеристика"
    const filePath = "catalog.yaml"
    const item = {
      itemType: "MetadataAttribute",
      name: "Характеристика",
      choiceParameterLinks: [
        {
          name: "Отбор.Владелец",
          dataPath: "Catalog.Товары.Attribute.Владелец",
        },
      ],
    }
    const rule = {
      itemType: "MetadataAttribute",
      properties: {
        choiceParameterLinks: { type: "ChoiceParameterLinks", yaml: "СвязиПараметровВыбора" },
      },
    } satisfies MetadataItemRule

    graph.ensureNode(parentNodeId, { name: "Характеристика" })
    graph.addFilePath(parentNodeId, filePath)
    graph.setItem(parentNodeId, item)

    buildGraphFromModel({
      model: item,
      yamlMap: undefined,
      rule,
      graph,
      parentNodeId,
      filePath,
    })

    const result = walkGraphToFileData(graph)
    const file = result.find((f) => f.filePath === filePath)
    const parent = file?.nodes.find((node) => node.id === parentNodeId)

    expect(parent?.props).not.toHaveProperty("p_choiceParameterLinks_0_name")
  })
})
