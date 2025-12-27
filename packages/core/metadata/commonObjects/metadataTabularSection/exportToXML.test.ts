import { describe, expect, it, vi } from "vitest"
import { mockСontext } from "~/packages/core/tests/mockContext"
import { readXMLFileAsString } from "~/packages/core/tests/readAndParseXMLFile"
import { xmlExport } from "~/packages/core/xml/export/exporter"
import { exportMetadataTabularSectionToXML } from "./exportToXML"
import { MetadataTabularSection } from "./types"

vi.mock("uuid", () => ({
  v4: vi.fn(() => "a87fba31-32d9-4b41-be05-e0141f6a803d"),
}))

describe("exportMetadataTabularSectionToXML", () => {
  it("should export tabular section with one attribute", () => {
    const data: MetadataTabularSection = {
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

    const expectedResult = readXMLFileAsString("metadataTabularSection/oneAttribute.xml")

    const context = {
      ...mockСontext,
      context: "Лиды" as any,
    }

    const result = exportMetadataTabularSectionToXML(context, data)
    const resultXml = xmlExport({ TabularSection: result }, false)

    expect(resultXml).toEqual(expectedResult)
  })

  it("should export tabular section with two attributes", () => {
    const data: MetadataTabularSection = {
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

    const expectedResult = readXMLFileAsString("metadataTabularSection/twoAttributes.xml")

    const context = {
      ...mockСontext,
      context: "Лиды" as any,
    }

    const result = exportMetadataTabularSectionToXML(context, data)
    const resultXml = xmlExport({ TabularSection: result }, false)

    expect(resultXml).toEqual(expectedResult)
  })
})
