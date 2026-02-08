import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToXML"
import { exportElementToXML } from "~/metadata/metadataFactory"
import {
  fullSearchControlAddition,
  fullSingleSearchControlAddition,
  minimalSearchControlAddition,
  minimalSingleSearchControlAddition,
  parentElement,
} from "~/tests/fixtures/forms/searchControlAddition/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportSingleSearchControlAdditionToXML } from "./exportToXML"

describe("exportSearchControlAdditionToXML", () => {
  describe("exportSingleSearchControlAdditionToXML", () => {
    it("should return all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/searchControlAddition/fullSingle.xml")

      const xmlData = exportSingleSearchControlAdditionToXML(
        mockContext,
        mockRule,
        fullSingleSearchControlAddition,
        parentElement
      )

      const result = xmlExport({ SearchControlAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })

    it("should return default when data is undefined", () => {
      const expectedResult = readXMLFileAsString("forms/searchControlAddition/minimalSingle.xml")

      const xmlData = exportSingleSearchControlAdditionToXML(mockContext, mockRule, undefined, parentElement)

      const result = xmlExport({ SearchControlAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/searchControlAddition/minimalSingle.xml")
      const xmlData = exportSingleSearchControlAdditionToXML(
        mockContext,
        mockRule,
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

      const xmlData = exportElementToXML({
        context: mockContext,
        element: fullSearchControlAddition,
      })

      const result = xmlExport({ SearchControlAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/searchControlAddition/minimal.xml")
      const xmlData = exportElementToXML({
        context: mockContext,
        element: minimalSearchControlAddition,
      })

      const result = xmlExport({ SearchControlAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })
  })
})
