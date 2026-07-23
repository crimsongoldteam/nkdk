import { describe, expect, it } from "vitest"

import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { encodeConfigurationIndex } from "../../configurationIndex/encode"
import { createConfigurationIndexExportRuntime } from "../../configurationIndex/exportRuntime"
import { childUid } from "../../configurationIndex/logicalAddress"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "../../configurationIndex/sharedSnapshot"
import { sampleIndex } from "../../configurationIndex/testData"
import type { ConfigurationContextWithExportToXML } from "../../context/types"
import type { YAMLToXMLNestedRule } from "../property/fromYAMLToXMLTypes"
import type { MetadataItemRule } from "../property/types"
import { convertMetadataCollectionFromYAMLToXML } from "./fromYAMLToXML"

const context = (): ConfigurationContextWithExportToXML => ({
  defaultLanguage: "ru",
  version: "2.20",
  exportToXML: { configDumpInfo: new Map(), version: "2.20", itemsTree: [] },
})

const nestedRule = {
  itemType: "CatalogAttribute",
  properties: {
    name: { type: "string", xml: "Name" },
    code: { type: "string", yaml: "Код", xml: "Code" },
    value: { type: "string", yaml: "Значение", xml: "Value" },
  },
} as const satisfies MetadataItemRule

describe("convertMetadataCollectionFromYAMLToXML", () => {
  it("рекурсивно преобразует YAML-запись коллекции без массива моделей", () => {
    const descriptor = {
      kind: "collection",
      itemRule: nestedRule,
      yamlShape: "record",
      xmlElement: "Item",
    } as const satisfies YAMLToXMLNestedRule

    const result = convertMetadataCollectionFromYAMLToXML({
      context: context(),
      yaml: { Первый: { Значение: "A" }, Второй: { Значение: "B" } },
      descriptor,
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({
      Item: [
        { Name: "Первый", Value: "A" },
        { Name: "Второй", Value: "B" },
      ],
    })
  })

  it("сопоставляет элементы YAML-массива с сырым reference XML по keyField", () => {
    const descriptor = {
      kind: "collection",
      itemRule: nestedRule,
      yamlShape: "array",
      xmlElement: "Item",
      keyField: "code",
    } as const satisfies YAMLToXMLNestedRule

    const result = convertMetadataCollectionFromYAMLToXML({
      context: context(),
      yaml: [
        { Код: "A", Значение: "новое A" },
        { Код: "B", Значение: "новое B" },
      ],
      descriptor,
      outputs: [
        {
          key: "owner",
          referenceXML: {
            Item: [
              { Code: "B", Unknown: "для B" },
              { Code: "A", Unknown: "для A" },
            ],
          },
        },
      ],
    })

    expect(result.outputs.get("owner")).toEqual({
      Item: [
        { Code: "A", Value: "новое A", Unknown: "для A" },
        { Code: "B", Value: "новое B", Unknown: "для B" },
      ],
    })
  })

  it("выбирает правила каждого элемента полиморфной коллекции", () => {
    const alternateRule = {
      itemType: "AlternateAttribute",
      xsiType: "test:Alternate",
      properties: {
        alternate: { type: "string", yaml: "Другое", xml: "Alternate" },
      },
    } as const satisfies MetadataItemRule
    const descriptor = {
      kind: "collection",
      itemRule: nestedRule,
      resolveItemRule: ({ yaml }) =>
        typeof yaml === "object" && yaml !== null && "Другое" in yaml ? alternateRule : nestedRule,
      yamlShape: "array",
      xmlElement: "Item",
    } as const satisfies YAMLToXMLNestedRule

    const result = convertMetadataCollectionFromYAMLToXML({
      context: context(),
      yaml: [{ Значение: "обычное" }, { Другое: "особое" }],
      descriptor,
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({
      Item: [{ Value: "обычное" }, { "_xsi:type": "test:Alternate", Alternate: "особое" }],
    })
  })

  it("адресует элементы массива по keyField в индексе конфигурации", () => {
    const collector = createConfigurationIndexCollector()
    const configurationIndex = createConfigurationIndexExportRuntime({
      source: createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(sampleIndex()))),
      collector,
      targetProjectPath: "test.yaml",
      logicalAddress: "Тест",
    })
    const descriptor = {
      kind: "collection",
      itemRule: nestedRule,
      yamlShape: "array",
      xmlElement: "Item",
      keyField: "code",
      configurationIndexUidSegment: "Элемент",
    } as const satisfies YAMLToXMLNestedRule

    convertMetadataCollectionFromYAMLToXML({
      context: {
        ...context(),
        exportToXML: { ...context().exportToXML, configurationIndex },
      },
      yaml: [
        { Код: "A", Значение: "первое" },
        { Код: "B", Значение: "второе" },
      ],
      descriptor,
      outputs: [{ key: "owner" }],
    })

    expect(collector.fragment("test.yaml").xmlNodes.map(({ logicalAddress }) => logicalAddress)).toEqual([
      `${childUid("Тест", "Элемент", "A")}.Свойство.Код`,
      `${childUid("Тест", "Элемент", "A")}.Свойство.Значение`,
      `${childUid("Тест", "Элемент", "B")}.Свойство.Код`,
      `${childUid("Тест", "Элемент", "B")}.Свойство.Значение`,
    ])
  })
})
