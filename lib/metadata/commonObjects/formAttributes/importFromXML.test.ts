import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { readAndParseXMLFile } from "~/lib/tests/readAndParseXMLFile"
import { importFormAttributeFromXML } from "./importFromXML"
import { FormAttribute, FormAttributeXML, FormAttributesXML } from "./types"

describe("importFormAttributeFromXML", () => {
  it("should import attribute from XML", () => {
    const xmlData = readAndParseXMLFile<FormAttributeXML>("formAttributes/withTitleAndType.xml")

    const mockResult: FormAttribute = {
      name: "Поле",
      id: "1",
      valueType: {
        type: ["string"],
        stringQualifiers: { length: 0, allowedLength: "Variable" },
      },
      title: { items: { ru: "Заголовок поля" } },
    }

    const result = importFormAttributeFromXML(mockConfigurationSettings, xmlData)

    expect(result).toEqual(mockResult)
  })

  it("should import attribute with empty type", () => {
    const xmlData = readAndParseXMLFile<FormAttributeXML>("formAttributes/withEmptyType.xml")

    const mockResult: FormAttribute = {
      name: "Фамилия",
      id: "1",
    }

    const result = importFormAttributeFromXML(mockConfigurationSettings, xmlData)

    expect(result).toEqual(mockResult)
  })

  it("should import stored and main attribute from XML", () => {
    const xmlData = readAndParseXMLFile<FormAttributeXML>("formAttributes/withMainAndStored.xml")

    const mockResult: FormAttribute = {
      name: "Фамилия",
      id: "1",
      valueType: { type: ["string"] },
      mainAttribute: true,
      storedData: true,
    }

    const result = importFormAttributeFromXML(mockConfigurationSettings, xmlData)

    expect(result).toEqual(mockResult)
  })

  it("should ignore ConditionalAppearance from XML", () => {
    const xmlData = readAndParseXMLFile<{ Attributes: FormAttributesXML }>("formAttributes/conditionalAppearance.xml")

    const result = importFormAttributeFromXML(mockConfigurationSettings, xmlData.Attributes?.[0] as FormAttributeXML)

    expect(result).toBeUndefined()
  })
})
