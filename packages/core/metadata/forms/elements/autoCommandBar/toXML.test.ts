import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { fullAutoCommandBar, minimalAutoCommandBar } from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportFormAutoCommandBarToXML, exportTableAutoCommandBarToXML } from "./toXML"

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
      const context: ConfigurationContext = {
        ...mockContext,
        elementContext: {
          name: "КакойТоЭлемент",
        },
      }

      const expectedResult = readXMLFileAsString("forms/autoCommandBar/minimalTable.xml")

      const xmlData = exportTableAutoCommandBarToXML(context, mockRule, undefined)

      const result = xmlExport({ AutoCommandBar: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })

    it("should return all fields to XML", () => {
      const context: ConfigurationContext = {
        ...mockContext,
        elementContext: {
          name: "КакойТоЭлемент",
        },
      }
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/fullTable.xml")
      const xmlData = exportTableAutoCommandBarToXML(context, mockRule, fullAutoCommandBar)
      const result = xmlExport({ AutoCommandBar: xmlData }, false)
      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const context: ConfigurationContext = {
        ...mockContext,
        elementContext: {
          name: "КакойТоЭлемент",
        },
      }
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/minimalTable.xml")
      const xmlData = exportTableAutoCommandBarToXML(context, mockRule, minimalAutoCommandBar)
      const result = xmlExport({ AutoCommandBar: xmlData }, false)
      expect(result).toEqual(expectedResult)
    })
  })
})
