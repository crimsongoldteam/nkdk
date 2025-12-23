import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { readAndParseXMLFile } from "~/lib/tests/readAndParseXMLFile"
import { importMetadataTabularSectionFromXML } from "./importFromXML"
import { MetadataTabularSection, MetadataTabularSectionXML } from "./types"

describe("importMetadataTabularSectionFromXML", () => {
  it("should import with one attribute", () => {
    const xmlData = readAndParseXMLFile<{ TabularSection: MetadataTabularSectionXML }>(
      "metadataTabularSection/oneAttribute.xml"
    )

    const expectedResult: MetadataTabularSection = {
      name: "Контакты",
      synonym: { items: { ru: "Контакты" } },
      attributes: [
        {
          name: "Наименование",
          synonym: { items: { ru: "Имя Фамилия" } },
          type: {
            type: ["string"],
            stringQualifiers: { allowedLength: "Variable", length: 0 },
          },
          fullTextSearch: "DontUse",
        },
      ],
    }
    const result = importMetadataTabularSectionFromXML(mockConfigurationSettings, xmlData.TabularSection)
    expect(result).toEqual(expectedResult)
  })

  it("should import with two attributes", () => {
    const xmlData = readAndParseXMLFile<{ TabularSection: MetadataTabularSectionXML }>(
      "metadataTabularSection/twoAttributes.xml"
    )

    const expectedResult: MetadataTabularSection = {
      name: "Контакты",
      synonym: { items: { ru: "Контакты" } },
      attributes: [
        {
          name: "Наименование",
          synonym: { items: { ru: "Имя Фамилия" } },
          type: {
            type: ["string"],
            stringQualifiers: { allowedLength: "Variable", length: 0 },
          },
          fullTextSearch: "DontUse",
        },
        {
          name: "ИдентификаторСтрокиТабличнойЧасти",
          synonym: { items: { ru: "Идентификатор строки табличной части" } },
          type: {
            type: ["decimal"],
            numberQualifiers: { digits: 7, fractionDigits: 0, allowedSign: "Any" },
          },
          fullTextSearch: "DontUse",
        },
      ],
    }

    const result = importMetadataTabularSectionFromXML(mockConfigurationSettings, xmlData.TabularSection)
    expect(result).toEqual(expectedResult)
  })
})
