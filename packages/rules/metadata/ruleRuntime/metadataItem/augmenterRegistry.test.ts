import { describe, expect, it } from "vitest"
import "../../../tests/metadataExecutionContext"
import { mockContextFromXML } from "../../../tests/mockContext"
import type { MetadataItemRule } from "../property/types"
import {
  applyMetadataItemXmlImportAugmenter,
  createMetadataItemXmlImportAugmenterRegistry,
  registerMetadataItemXmlImportAugmenter,
  resolveMetadataItemXMLDefaultVariant,
} from "./augmenterRegistry"

const rule = {
  itemType: "MetadataItemAugmenterTest",
  properties: {},
} satisfies MetadataItemRule

describe("metadata item XML import augmenter registry", () => {
  it("применяет обработчик, выбранный строковым ключом контекста", () => {
    registerMetadataItemXmlImportAugmenter("metadata-item-augmenter-test", {
      augment({ source, yaml }) {
        yaml["Дополнение"] = source["Value"]
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
      resolveCurrentXMLDefaultVariant: ({ source }) =>
        source.Value === "borrowed" ? "adopted" : "full",
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
    augmenter: { augment: ({ yaml }) => { yaml.value = value } },
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
