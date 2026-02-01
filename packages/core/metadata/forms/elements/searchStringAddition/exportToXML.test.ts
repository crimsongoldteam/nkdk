import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToXML"
import {
  fullSearchStringAddition,
  fullSingleSearchStringAddition,
  minimalSearchStringAddition,
  minimalSingleSearchStringAddition,
  parentElement,
} from "~/tests/fixtures/forms/searchStringAddition/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportSearchStringAdditionToXML, exportSingleSearchStringAdditionToXML } from "./exportToXML"

describe("exportSearchStringAdditionToXML", () => {
  describe("exportSingleSearchStringAdditionToXML", () => {
    it("should return all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/searchStringAddition/fullSingle.xml")

      const xmlData = exportSingleSearchStringAdditionToXML(mockContext, fullSingleSearchStringAddition, parentElement)

      const result = xmlExport({ SearchStringAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })

    it("should return default when data is undefined", () => {
      const expectedResult = readXMLFileAsString("forms/searchStringAddition/minimalSingle.xml")

      const xmlData = exportSingleSearchStringAdditionToXML(mockContext, undefined, parentElement)

      const result = xmlExport({ SearchStringAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/searchStringAddition/minimalSingle.xml")
      const xmlData = exportSingleSearchStringAdditionToXML(
        mockContext,
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

      const xmlData = exportSearchStringAdditionToXML(mockContext, fullSearchStringAddition)

      const result = xmlExport({ SearchStringAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/searchStringAddition/minimal.xml")
      const xmlData = exportSearchStringAdditionToXML(mockContext, minimalSearchStringAddition)

      const result = xmlExport({ SearchStringAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })
  })
})
