import { beforeEach, describe, expect, it } from "vitest"
import { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
import { walkGraphToFileData } from "~/metadata/orchestration/buildGraph/walkGraphToFileData"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { importRegisteredMetadataSourceWithGraph } from "./importRegisteredMetadataSourceWithGraph"
import {
  clearGraphImportRegistry,
  registerGraphImport,
  resolveGraphImportSource,
  toGraphModel,
} from "./registry"
import { declareMetadataItemGraphRoot } from "./root"

const testRule = {
  itemType: "MetadataCatalog",
  itemTypePrefix: "ТестовыйОбъект",
  graphTerminals: ["ПустаяСсылка"],
  properties: {},
} satisfies MetadataItemRule

const context = {
  version: "2.20",
  defaultLanguage: "ru",
}

describe("graphImport registry", () => {
  beforeEach(() => {
    clearGraphImportRegistry()
  })

  it("резолвит источник через зарегистрированный шаблон пути", () => {
    registerGraphImport({
      kind: "test-item",
      phase: 3,
      matchPath: (filePath) => {
        const parts = filePath.split("/")
        if (parts.length !== 3 || parts[0] !== "ТестовыйОбъект" || parts[2] !== "Свойства.yaml") return undefined
        return { kind: "test-item", name: parts[1]!, pathParams: { prefix: parts[0]! } }
      },
      importModel: ({ name }) => {
        const model = { itemType: "MetadataCatalog", name }
        return { model, graphModel: toGraphModel(model), rule: testRule }
      },
      declareRoot: ({ graph, rule, name, filePath }) =>
        declareMetadataItemGraphRoot({ graph, rule, name, filePath }),
    })

    expect(resolveGraphImportSource("ТестовыйОбъект/Демо/Свойства.yaml")).toEqual({
      kind: "test-item",
      name: "Демо",
      phase: 3,
      pathParams: { prefix: "ТестовыйОбъект" },
    })
  })

  it("импортирует фиктивный тип, объявляет корень и терминалы", async () => {
    registerGraphImport({
      kind: "test-item",
      matchPath: (filePath) => {
        const parts = filePath.split("/")
        if (parts.length !== 3 || parts[0] !== "ТестовыйОбъект" || parts[2] !== "Свойства.yaml") return undefined
        return { kind: "test-item", name: parts[1]!, pathParams: {} }
      },
      importModel: ({ name }) => {
        const model = { itemType: "MetadataCatalog", name, comment: "из теста" }
        return { model, graphModel: toGraphModel(model), rule: testRule }
      },
      declareRoot: ({ graph, rule, name, filePath }) =>
        declareMetadataItemGraphRoot({ graph, rule, name, filePath }),
    })

    const graph = new GraphBuilder()
    const result = await importRegisteredMetadataSourceWithGraph({
      filePath: "ТестовыйОбъект/Демо/Свойства.yaml",
      sources: { yaml: "Комментарий: из теста\n" },
      kind: "test-item",
      name: "Демо",
      graph,
      context,
    })

    expect(result?.model.itemType).toBe("MetadataCatalog")
    expect(graph.hasNode("ТестовыйОбъект.Демо")).toBe(true)
    expect(graph.hasNode("ТестовыйОбъект.Демо.ПустаяСсылка")).toBe(true)

    const files = walkGraphToFileData(graph)
    expect(files).toContainEqual(
      expect.objectContaining({
        filePath: "ТестовыйОбъект/Демо/Свойства.yaml",
        declaredNodeIds: expect.arrayContaining([
          "ТестовыйОбъект.Демо",
          "ТестовыйОбъект.Демо.ПустаяСсылка",
        ]),
      }),
    )
  })
})
