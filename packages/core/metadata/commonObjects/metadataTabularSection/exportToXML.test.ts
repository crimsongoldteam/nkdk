import { describe, expect, it, vi } from "vitest"
import { twoAttributes } from "~/tests/fixtures/metadataTabularSection/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
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
    const data = twoAttributes

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
