import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import xmlImport from "~/lib/xml/import/importer"
import { importMetadataTabularSectionFromXML } from "./importFromXML"
import { MetadataTabularSection, MetadataTabularSectionXML } from "./types"

describe("importMetadataTabularSectionFromXML", () => {
  it("should import with one attribute", () => {
    const xml = readFileSync(join(process.cwd(), "tests/fixtures/metadataTabularSection/oneAttribute.xml"), "utf-8")

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
    const xmlData = xmlImport<{ TabularSection: MetadataTabularSectionXML }>(xml)
    const result = importMetadataTabularSectionFromXML(xmlData.TabularSection, mockConfigurationSettings)
    expect(result).toEqual(expectedResult)
  })

  it("should import with two attributes", () => {
    const xml = readFileSync(join(process.cwd(), "tests/fixtures/metadataTabularSection/twoAttributes.xml"), "utf-8")

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

    const xmlData = xmlImport<{ TabularSection: MetadataTabularSectionXML }>(xml)
    const result = importMetadataTabularSectionFromXML(xmlData.TabularSection, mockConfigurationSettings)
    expect(result).toEqual(expectedResult)
  })
})
