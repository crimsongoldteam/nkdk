import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToXML"
import {
  fullSearchControlAddition,
  fullSingleSearchControlAddition,
  minimalSearchControlAddition,
  minimalSingleSearchControlAddition,
  parentElement,
} from "~/tests/fixtures/forms/searchControlAddition/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportSearchControlAdditionToXML, exportSingleSearchControlAdditionToXML } from "./exportToXML"

describe("exportSearchControlAdditionToXML", () => {
  describe("exportSingleSearchControlAdditionToXML", () => {
    it("should return all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/searchControlAddition/fullSingle.xml")

      const xmlData = exportSingleSearchControlAdditionToXML(mockСontext, fullSingleSearchControlAddition, parentElement)

      const result = xmlExport({ SearchControlAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })

    it("should return default when data is undefined", () => {
      const expectedResult = readXMLFileAsString("forms/searchControlAddition/minimalSingle.xml")

      const xmlData = exportSingleSearchControlAdditionToXML(mockСontext, undefined, parentElement)

      const result = xmlExport({ SearchControlAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/searchControlAddition/minimalSingle.xml")
      const xmlData = exportSingleSearchControlAdditionToXML(
        mockСontext,
        minimalSingleSearchControlAddition,
        parentElement
      )

      const result = xmlExport({ SearchControlAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })
  })

  describe("exportSearchControlAdditionToXML", () => {
    it("should return all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/searchControlAddition/full.xml")

      const xmlData = exportSearchControlAdditionToXML(mockСontext, fullSearchControlAddition)

      const result = xmlExport({ SearchControlAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/searchControlAddition/minimal.xml")
      const xmlData = exportSearchControlAdditionToXML(mockСontext, minimalSearchControlAddition)

      const result = xmlExport({ SearchControlAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })
  })
})
