import { describe, expect, it } from "vitest"
import { importMetadataItemFromXML } from "~/metadata/orchestration"
import { mockContextFromXML } from "~/tests/mockContext"
import { MetadataTaskAddressingAttributeRules } from "./rules"
import { MetadataTaskAddressingAttribute } from "./types"

describe("MetadataTaskAddressingAttribute", () => {
  it("imports addressing dimension", () => {
    const result = importMetadataItemFromXML({
      context: mockContextFromXML(),
      rule: MetadataTaskAddressingAttributeRules,
      xml: {
        _uuid: "d7d973ca-def2-485f-afd4-e16fb8ae54f5",
        Properties: {
          Name: "РеквизитАдресации",
          Synonym: "",
          Comment: "",
          Type: { "v8:Type": "xs:string" },
          AddressingDimension: "InformationRegister.Адресация.Dimension.Исполнитель",
        },
      },
    }) as MetadataTaskAddressingAttribute | undefined

    expect(result).toMatchObject({
      name: "РеквизитАдресации",
      addressingDimension: "InformationRegister.Адресация.Dimension.Исполнитель",
    })
  })
})
