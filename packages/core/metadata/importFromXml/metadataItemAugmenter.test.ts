import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../tests/mockContext"
import type { MetadataItemRule } from "../orchestration/property/types"
import {
  applyMetadataItemXmlImportAugmenter,
  registerMetadataItemXmlImportAugmenter,
} from "./metadataItemAugmenter"

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
})
