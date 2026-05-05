import { describe, expect, it } from "vitest"
import { buildGraphFromModel } from "./buildGraphFromModel"
import { GraphBuilder } from "./buildGraph/internal/GraphBuilder"
import { walkGraphToFileData } from "./buildGraph/walkGraphToFileData"
import type { MetadataItemRule } from "./property/types"

import "~/metadata/forms/commonObjects/dataPath/graphFromModel"

describe("buildGraphFromModel", () => {
  it("не дублирует свойство с buildGraphFromModel в props родительского узла", () => {
    const graph = new GraphBuilder()
    const formNodeId = "Форма"
    const parentNodeId = "Форма.Элемент.Поле"
    const filePath = "form.yaml"
    const item = {
      itemType: "FormAttribute",
      name: "Поле",
      dataPath: "Объект.Имя",
    }
    const rule = {
      itemType: "FormAttribute",
      properties: {
        dataPath: { type: "DataPath", yaml: "ПутьКДанным", defaultType: "string" },
      },
    } satisfies MetadataItemRule

    graph.ensureNode(formNodeId, { name: "Форма" })
    graph.ensureNode("Форма.Реквизит.Объект", { name: "Объект" })
    graph.ensureNode("Справочник.Товары", { name: "Товары" })
    graph.ensureNode("Справочник.Товары.Имя", { name: "Имя" })
    graph.ensureEdge(formNodeId, "Форма.Реквизит.Объект", "FORM_ATTRIBUTE", { yaml: "РеквизитФормы" })
    graph.ensureEdge("Форма.Реквизит.Объект", "Справочник.Товары", "TYPE", { yaml: "Тип" })
    graph.ensureNode(parentNodeId, { name: "Поле" })
    graph.addFilePath(parentNodeId, filePath)
    graph.setItem(parentNodeId, item)

    buildGraphFromModel({
      model: item,
      yamlMap: undefined,
      rule,
      graph,
      parentNodeId,
      filePath,
      extra: { formNodeId },
    })

    const result = walkGraphToFileData(graph)
    const file = result.find((f) => f.filePath === filePath)
    const parent = file?.nodes.find((node) => node.id === parentNodeId)

    expect(parent?.props).not.toHaveProperty("p_dataPath")
  })
})
