import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToXML"
import { fullAutoCommandBar, minimalAutoCommandBar, parentElement } from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportFormAutoCommandBarToXML, exportTableAutoCommandBarToXML } from "./exportToXML"

describe("exportAutoCommandBarToXML", () => {
  describe("exportFormAutoCommandBarToXML", () => {
    it("should return default when data is undefined", () => {
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/minimalForm.xml")

      const xmlData = exportFormAutoCommandBarToXML(mockContext, mockRule, undefined)

      const result = xmlExport({ AutoCommandBar: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })
    it("should return all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/fullForm.xml")
      const xmlData = exportFormAutoCommandBarToXML(mockContext, mockRule, fullAutoCommandBar)
      const result = xmlExport({ AutoCommandBar: xmlData }, false)
      expect(result).toEqual(expectedResult)
    })
    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/minimalForm.xml")
      const xmlData = exportFormAutoCommandBarToXML(mockContext, mockRule, minimalAutoCommandBar)
      const result = xmlExport({ AutoCommandBar: xmlData }, false)
      expect(result).toEqual(expectedResult)
    })
  })

  describe("exportTableAutoCommandBarToXML", () => {
    it("should return default when data is undefined", () => {
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/minimalTable.xml")

      const xmlData = exportTableAutoCommandBarToXML(mockContext, mockRule, undefined, parentElement)

      const result = xmlExport({ AutoCommandBar: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })
    it("should return all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/fullTable.xml")
      const xmlData = exportTableAutoCommandBarToXML(mockContext, mockRule, fullAutoCommandBar, parentElement)
      const result = xmlExport({ AutoCommandBar: xmlData }, false)
      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/minimalTable.xml")
      const xmlData = exportTableAutoCommandBarToXML(mockContext, mockRule, minimalAutoCommandBar, parentElement)
      const result = xmlExport({ AutoCommandBar: xmlData }, false)
      expect(result).toEqual(expectedResult)
    })
  })
})
