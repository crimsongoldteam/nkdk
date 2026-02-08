import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToXML"
import {
  fullSearchStringAddition,
  fullSingleSearchStringAddition,
  minimalSearchStringAddition,
  minimalSingleSearchStringAddition,
  parentElement,
} from "~/tests/fixtures/forms/searchStringAddition/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { exportSingleSearchStringAdditionToXML } from "./exportToXML"

describe("exportSearchStringAdditionToXML", () => {
  describe("exportSingleSearchStringAdditionToXML", () => {
    it("should return all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/searchStringAddition/fullSingle.xml")

      const xmlData = exportSingleSearchStringAdditionToXML(
        mockContext,
        mockRule,
        fullSingleSearchStringAddition,
        parentElement
      )

      const result = xmlExport({ SearchStringAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })

    it("should return default when data is undefined", () => {
      const expectedResult = readXMLFileAsString("forms/searchStringAddition/minimalSingle.xml")

      const xmlData = exportSingleSearchStringAdditionToXML(mockContext, mockRule, undefined, parentElement)

      const result = xmlExport({ SearchStringAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/searchStringAddition/minimalSingle.xml")
      const xmlData = exportSingleSearchStringAdditionToXML(
        mockContext,
        mockRule,
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

      const xmlData = exportElementToXML({
        context: mockContext,
        data: fullSearchStringAddition,
      })

      const result = xmlExport({ SearchStringAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/searchStringAddition/minimal.xml")
      const xmlData = exportElementToXML({
        context: mockContext,
        data: minimalSearchStringAddition,
      })

      const result = xmlExport({ SearchStringAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })
  })
})
