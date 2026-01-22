import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToXML"
import {
  fullSearchStringAddition,
  fullSingleSearchStringAddition,
  minimalSearchStringAddition,
  minimalSingleSearchStringAddition,
  parentElement,
} from "~/tests/fixtures/forms/searchStringAddition/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportSearchStringAdditionToXML, exportSingleSearchStringAdditionToXML } from "./exportToXML"

describe("exportSearchStringAdditionToXML", () => {
  describe("exportSingleSearchStringAdditionToXML", () => {
    it("should return all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/searchStringAddition/fullSingle.xml")

      const xmlData = exportSingleSearchStringAdditionToXML(mockСontext, fullSingleSearchStringAddition, parentElement)

      const result = xmlExport({ SearchStringAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })

    it("should return default when data is undefined", () => {
      const expectedResult = readXMLFileAsString("forms/searchStringAddition/minimalSingle.xml")

      const xmlData = exportSingleSearchStringAdditionToXML(mockСontext, undefined, parentElement)

      const result = xmlExport({ SearchStringAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/searchStringAddition/minimalSingle.xml")
      const xmlData = exportSingleSearchStringAdditionToXML(
        mockСontext,
        minimalSingleSearchStringAddition,
        parentElement
      )

      const result = xmlExport({ SearchStringAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })
  })

  describe("exportSearchStringAdditionToXML", () => {
    it("should return all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/searchStringAddition/full.xml")

      const xmlData = exportSearchStringAdditionToXML(mockСontext, fullSearchStringAddition, parentElement)

      const result = xmlExport({ SearchStringAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/searchStringAddition/minimal.xml")
      const xmlData = exportSearchStringAdditionToXML(mockСontext, minimalSearchStringAddition, parentElement)

      const result = xmlExport({ SearchStringAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })
  })
})
