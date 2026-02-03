import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportInternalInfoToXML } from "./exportToXML"

describe("exportInternalInfoToXML", () => {
  it("should export single", () => {
    const expectedResult = readXMLFileAsString("internalInfo/single.xml")

    const result = exportInternalInfoToXML(mockContext, [
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

    const result = exportInternalInfoToXML(mockContext, [
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
