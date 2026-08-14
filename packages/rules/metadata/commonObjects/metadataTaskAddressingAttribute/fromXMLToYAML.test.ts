import { describe, expect, it } from "vitest"

import { testMetadataItemFromXMLToYAML } from "../../../tests/directConversion"
import { mockContextFromXML } from "../../../tests/mockContext"
import { MetadataTaskAddressingAttributeRules } from "./rules"

describe("MetadataTaskAddressingAttribute XML → YAML", () => {
  it("uses a dedicated item type for PropertyState capabilities", () => {
    expect(MetadataTaskAddressingAttributeRules.itemType).toBe("MetadataTaskAddressingAttribute")
  })

  it("does not expose fields that are not valid for task addressing attributes", () => {
    expect(MetadataTaskAddressingAttributeRules.properties).not.toHaveProperty("use")
    expect(MetadataTaskAddressingAttributeRules.properties).not.toHaveProperty("binaryDataStorageLocationUse")
    expect(MetadataTaskAddressingAttributeRules.properties).not.toHaveProperty("binaryDataStorageLocationUseField")
  })

  it("imports addressing dimension", () => {
    const result = testMetadataItemFromXMLToYAML({
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
    }).yaml

    expect(result).toMatchObject({
      Тип: "Строка",
      ИзмерениеАдресации: "РегистрСведений.Адресация.Измерение.Исполнитель",
    })
  })

  it("импортирует очищенное измерение адресации как null", () => {
    const baseContext = mockContextFromXML()
    const context = {
      ...baseContext,
      fromXML: { ...baseContext.fromXML, propertyStateCompatibilityMode: "Version8_3_27" },
    }
    const result = testMetadataItemFromXMLToYAML({
      rule: MetadataTaskAddressingAttributeRules,
      context,
      xml: {
        Properties: {
          Name: "РеквизитАдресации",
          Type: { "v8:Type": "xs:string" },
          AddressingDimension: undefined,
        },
      },
    }).yaml

    expect(result).toHaveProperty("ИзмерениеАдресации", null)
  })

  it("не добавляет отсутствующее измерение адресации", () => {
    const result = testMetadataItemFromXMLToYAML({
      rule: MetadataTaskAddressingAttributeRules,
      xml: {
        Properties: {
          Name: "РеквизитАдресации",
          Type: { "v8:Type": "xs:string" },
        },
      },
    }).yaml

    expect(result).not.toHaveProperty("ИзмерениеАдресации")
  })
})
