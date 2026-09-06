import { describe, expect, it } from "vitest"
import "../../../tests/metadataExecutionContext"
import { mockContextFromXML } from "../../../tests/mockContext"
import type { MetadataItemRule } from "../property/types"
import {
  applyMetadataItemXmlImportAugmenter,
  createMetadataItemXmlImportAugmenterRegistry,
  registerMetadataItemXmlImportAugmenter,
  resolveMetadataItemXMLDefaultVariant,
  metadataItemXmlImportYamlDependencies,
} from "./augmenterRegistry"

const rule = {
  itemType: "MetadataItemAugmenterTest",
  properties: {},
} satisfies MetadataItemRule

describe("metadata item XML import augmenter registry", () => {
  it("объявляет входные YAML-поля без чтения значений", () => {
    registerMetadataItemXmlImportAugmenter("selected-yaml-fields", {
      yamlDependencies: () => ["Выбранное"], augment() {},
    })
    const context = { ...mockContextFromXML(), fromXML: {
      ...mockContextFromXML().fromXML, metadataItemAugmenter: "selected-yaml-fields",
    } }
    expect(metadataItemXmlImportYamlDependencies({ context, rule, source: {} })).toEqual(["Выбранное"])
    expect(metadataItemXmlImportYamlDependencies({ context: mockContextFromXML(), rule, source: {} })).toEqual([])
  })

  it("применяет обработчик, выбранный строковым ключом контекста", () => {
    registerMetadataItemXmlImportAugmenter("metadata-item-augmenter-test", {
      yamlDependencies: () => [],
      augment({ source, yaml }) {
        yaml["Дополнение"] = "Value" in source ? source.Value : undefined
      },
    })
    const context = {
      ...mockContextFromXML(),
      fromXML: {
        ...mockContextFromXML().fromXML,
        metadataItemAugmenter: "metadata-item-augmenter-test",
      },
    }
    const yaml: Record<string, unknown> = {}

    applyMetadataItemXmlImportAugmenter({
      context,
      rule,
      source: { Value: "готово" },
      yaml,
    })

    expect(yaml).toEqual({ Дополнение: "готово" })
  })

  it("не изменяет YAML без ключа обработчика", () => {
    const yaml: Record<string, unknown> = {}

    applyMetadataItemXmlImportAugmenter({
      context: mockContextFromXML(),
      rule,
      source: { Value: "лишнее" },
      yaml,
    })

    expect(yaml).toEqual({})
  })

  it("разрешает вариант до применения обработчика", () => {
    registerMetadataItemXmlImportAugmenter("metadata-item-variant-test", {
      yamlDependencies: () => [],
      resolveCurrentXMLDefaultVariant: ({ source }) =>
        "Value" in source && source.Value === "borrowed" ? "adopted" : "full",
      augment() {},
    })
    const context = {
      ...mockContextFromXML(),
      fromXML: {
        ...mockContextFromXML().fromXML,
        metadataItemAugmenter: "metadata-item-variant-test",
      },
    }

    expect(resolveMetadataItemXMLDefaultVariant({
      context,
      rule,
      source: { Value: "borrowed" },
    })).toBe("adopted")
    expect(resolveMetadataItemXMLDefaultVariant({
      context: mockContextFromXML(),
      rule,
      source: { Value: "borrowed" },
    })).toBeUndefined()
  })
})

it("isolates XML import augmenters between registry instances", () => {
  const createRegistry = (value: string) => createMetadataItemXmlImportAugmenterRegistry([{
    name: "sample",
    augmenter: { yamlDependencies: () => [], augment: ({ yaml }) => { yaml.value = value } },
  }])
  const context = {
    ...mockContextFromXML(),
    fromXML: { ...mockContextFromXML().fromXML, metadataItemAugmenter: "sample" },
  }
  const firstYaml: Record<string, unknown> = {}
  const secondYaml: Record<string, unknown> = {}

  createRegistry("first").apply({ context, rule, source: {}, yaml: firstYaml })
  createRegistry("second").apply({ context, rule, source: {}, yaml: secondYaml })

  expect(firstYaml.value).toBe("first")
  expect(secondYaml.value).toBe("second")
})
