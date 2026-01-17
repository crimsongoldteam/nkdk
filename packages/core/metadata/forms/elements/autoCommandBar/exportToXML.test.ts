import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToXML"
import { fullAutoCommandBar, minimalAutoCommandBar, parentElement } from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportFormAutoCommandBarToXML, exportTableAutoCommandBarToXML } from "./exportToXML"

describe("exportAutoCommandBarToXML", () => {
  describe("exportFormAutoCommandBarToXML", () => {
    it("should return default when data is undefined", () => {
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/minimalForm.xml")

      const xmlData = exportFormAutoCommandBarToXML(mockСontext, undefined)

      const result = xmlExport({ AutoCommandBar: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })
    it("should return all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/fullForm.xml")
      const xmlData = exportFormAutoCommandBarToXML(mockСontext, fullAutoCommandBar)
      const result = xmlExport({ AutoCommandBar: xmlData }, false)
      expect(result).toEqual(expectedResult)
    })
    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/minimalForm.xml")
      const xmlData = exportFormAutoCommandBarToXML(mockСontext, minimalAutoCommandBar)
      const result = xmlExport({ AutoCommandBar: xmlData }, false)
      expect(result).toEqual(expectedResult)
    })
  })

  describe("exportTableAutoCommandBarToXML", () => {
    it("should return default when data is undefined", () => {
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/minimalTable.xml")

      const xmlData = exportTableAutoCommandBarToXML(mockСontext, undefined, parentElement)

      const result = xmlExport({ AutoCommandBar: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })
    it("should return all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/fullTable.xml")
      const xmlData = exportTableAutoCommandBarToXML(mockСontext, fullAutoCommandBar, parentElement)
      const result = xmlExport({ AutoCommandBar: xmlData }, false)
      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/minimalTable.xml")
      const xmlData = exportTableAutoCommandBarToXML(mockСontext, minimalAutoCommandBar, parentElement)
      const result = xmlExport({ AutoCommandBar: xmlData }, false)
      expect(result).toEqual(expectedResult)
    })
  })
})
