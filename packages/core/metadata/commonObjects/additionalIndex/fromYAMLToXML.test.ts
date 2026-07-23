import { describe, expect, it } from "vitest"

import { readAppliedObjectFixture, serializeDirectXML, testMetadataItemFromYAMLToXML } from "../../../tests/directConversion"
import { readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { AdditionalIndexRules } from "./rules"

import "./types"

const yaml = [
  {
    Имя: "Индекс1",
    Таблица: "Catalog.СправочникCоВсемиОбъектами",
    ИндексируемыеПоля: ["Ref"],
    ДополнительныеПоля: ["Description"],
  },
]

describe("AdditionalIndex YAML → XML", () => {
  it("round-trip from full.xml", () => {
    const referenceXML = readAppliedObjectFixture(import.meta.url, "full.xml")
    const result = testMetadataItemFromYAMLToXML({ rule: AdditionalIndexRules, yaml, referenceXML })

    expect(serializeDirectXML(result.xml)).toBe(readXMLFixtureAsString(import.meta.url, "full.xml"))
  })

  it("inline-array парсится в items без обёртки", () => {
    const result = testMetadataItemFromYAMLToXML({ rule: AdditionalIndexRules, yaml })

    expect(result.xml).toMatchObject({
      AdditionalIndexes: {
        AdditionalIndex: expect.arrayContaining([
          expect.objectContaining({ Name: "Индекс1", Table: "Catalog.СправочникCоВсемиОбъектами" }),
        ]),
      },
    })
  })

  it("exports fields in 1C-loadable order without reference", () => {
    const result = testMetadataItemFromYAMLToXML({
      rule: AdditionalIndexRules,
      yaml: [
        {
          Имя: "ОдинИндекс",
          Таблица: "Catalog.СправочникПолный",
          ИндексируемыеПоля: ["Code"],
          ДополнительныеПоля: ["Ref"],
        },
      ],
    })
    const exported = serializeDirectXML(result.xml)

    expect(exported).toContain(
      [
        '\t<AdditionalIndex id="11111111-1111-4111-8111-111111111111">',
        "\t\t<Name>ОдинИндекс</Name>",
        "\t\t<Table>Catalog.СправочникПолный</Table>",
        "\t\t<IndexedFields>",
        "\t\t\t<Field>Code</Field>",
        "\t\t</IndexedFields>",
        "\t\t<AdditionalFields>",
        "\t\t\t<Field>Ref</Field>",
        "\t\t</AdditionalFields>",
        "\t</AdditionalIndex>",
      ].join("\n")
    )
  })
})
