import { describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  readAppliedObjectFixture,
  serializeDirectXML,
  testMetadataItemFromXMLToYAML,
  testMetadataItemFromYAMLToXML,
} from "../../../tests/directConversion"
import { readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { AdditionalIndexRules } from "./rules"

import "./types"
import { yamlScalarTagAt } from "@nkdk/runtime"

const yaml = [
  {
    Имя: "Индекс1",
    Таблица: "Справочник.СправочникCоВсемиОбъектами",
    ИндексируемыеПоля: ["Ссылка"],
    ДополнительныеПоля: ["Наименование"],
  },
]

describe("AdditionalIndex YAML → XML", () => {
  it("round-trip from full.xml", () => {
    const referenceXML = readAppliedObjectFixture(import.meta.url, "full.xml")
    const contexts = additionalIndexContexts("СправочникCоВсемиОбъектами")
    const result = testMetadataItemFromYAMLToXML({
      context: contexts.exportContext(),
      rule: AdditionalIndexRules,
      yaml,
      referenceXML,
    })

    expect(serializeDirectXML(result.xml)).toBe(readXMLFixtureAsString(import.meta.url, "full.xml"))
  })

  it("inline-array парсится в items без обёртки", () => {
    const contexts = additionalIndexContexts("СправочникCоВсемиОбъектами")
    const result = testMetadataItemFromYAMLToXML({ context: contexts.exportContext(), rule: AdditionalIndexRules, yaml })

    expect(result.xml).toMatchObject({
      AdditionalIndexes: {
        AdditionalIndex: expect.arrayContaining([
          expect.objectContaining({ Name: "Индекс1", Table: "Catalog.СправочникCоВсемиОбъектами" }),
        ]),
      },
    })
  })

  it("exports fields in 1C-loadable order without reference", () => {
    const contexts = additionalIndexContexts("СправочникПолный")
    const result = testMetadataItemFromYAMLToXML({
      context: contexts.exportContext(),
      rule: AdditionalIndexRules,
      yaml: [
        {
          Имя: "ОдинИндекс",
          Таблица: "Справочник.СправочникПолный",
          ИндексируемыеПоля: ["Код"],
          ДополнительныеПоля: ["Ссылка"],
        },
      ],
    })
    const exported = serializeDirectXML(result.xml)

    expect(exported).toContain(
      [
        "\t\t<Name>ОдинИндекс</Name>",
        "\t\t<Table>Catalog.СправочникПолный</Table>",
        "\t\t<IndexedFields>",
        "\t\t\t<Field>Code</Field>",
        "\t\t</IndexedFields>",
        "\t\t<AdditionalFields>",
        "\t\t\t<Field>Ref</Field>",
        "\t\t</AdditionalFields>",
      ].join("\n")
    )
  })

  it("preserves a zero _id through the configuration index", () => {
    const contexts = additionalIndexContexts("Товары")
    const sourceXML = {
      AdditionalIndexes: {
        AdditionalIndex: [
          {
            _id: "00000000-0000-0000-0000-000000000000",
            Name: "Индекс1",
            Table: "Catalog.Товары",
          },
        ],
      },
    }
    const imported = testMetadataItemFromXMLToYAML({
      context: contexts.importContext,
      rule: AdditionalIndexRules,
      xml: sourceXML,
    })
    const exported = testMetadataItemFromYAMLToXML({
      context: contexts.exportContext(),
      rule: AdditionalIndexRules,
      yaml: imported.yaml,
    })

    expect(
      (exported.xml.AdditionalIndexes as { AdditionalIndex: Array<{ _id: string }> }).AdditionalIndex[0]?._id
    ).toBe("00000000-0000-0000-0000-000000000000")
  })

  it("preserves an explicitly empty fields container through !xml", () => {
    const contexts = additionalIndexContexts("Товары")
    const sourceXML = {
      AdditionalIndexes: {
        AdditionalIndex: [
          {
            _id: "00000000-0000-0000-0000-000000000001",
            Name: "Индекс1",
            Table: "Catalog.Товары",
            IndexedFields: { Field: "Ref" },
            AdditionalFields: {},
          },
        ],
      },
    }
    const imported = testMetadataItemFromXMLToYAML({
      context: contexts.importContext,
      rule: AdditionalIndexRules,
      xml: sourceXML,
    })
    const exported = testMetadataItemFromYAMLToXML({
      context: contexts.exportContext(),
      rule: AdditionalIndexRules,
      yaml: imported.yaml,
    })
    const item = (imported.yaml as Array<Record<string, unknown>>)[0]!
    expect(item.ДополнительныеПоля).toBe("!xml")
    expect(yamlScalarTagAt(item, "ДополнительныеПоля")).toBe("xml")

    expect(exported.xml).toMatchObject({
      AdditionalIndexes: {
        AdditionalIndex: [expect.objectContaining({ AdditionalFields: {} })],
      },
    })
  })
})

function additionalIndexContexts(ownerName: string) {
  return createDirectRoundTripContexts({
    metadataTargetOwners: [
      { itemType: "MetadataCatalog", name: ownerName, owner: { root: "Catalog", objectName: ownerName } },
    ],
  })
}
