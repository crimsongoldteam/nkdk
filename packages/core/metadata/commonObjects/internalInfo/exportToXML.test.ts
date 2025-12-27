import { describe, expect, it, vi } from "vitest"
import { readXMLFileAsString } from "~/packages/core/tests/readAndParseXMLFile"
import { xmlExport } from "~/packages/core/xml/export/exporter"
import { exportInternalInfoToXML } from "./exportToXML"

vi.mock("uuid", () => ({
  v4: vi.fn(() => "8f93c5cf-a2f6-4d79-ab40-83f36042b478"),
}))

describe("exportInternalInfoToXML", () => {
  it("should export single", () => {
    const expectedResult = readXMLFileAsString("internalInfo/single.xml")

    const result = exportInternalInfoToXML([
      {
        name: "CatalogTabularSection.Лиды.Контакты",
        category: "TabularSection",
      },
    ])

    const resultXml = xmlExport({ InternalInfo: result }, false)

    expect(resultXml).toEqual(expectedResult)
  })

  it("should export multiple", () => {
    const expectedResult = readXMLFileAsString("internalInfo/multiple.xml")

    const result = exportInternalInfoToXML([
      {
        name: "CatalogTabularSection.Лиды.Контакты",
        category: "TabularSection",
      },
      {
        name: "CatalogTabularSectionRow.Лиды.Контакты",
        category: "TabularSectionRow",
      },
    ])

    const resultXml = xmlExport({ InternalInfo: result }, false)

    expect(resultXml).toEqual(expectedResult)
  })
})
