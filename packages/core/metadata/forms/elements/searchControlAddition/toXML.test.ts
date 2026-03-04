import { beforeEach, describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportElementToXML, exportPropertyToXML } from "~/metadata/metadataFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import {
  fullSearchControlAddition,
  fullSingleSearchControlAddition,
  minimalSearchControlAddition,
  minimalSingleSearchControlAddition,
} from "~/tests/fixtures/forms/searchControlAddition/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

const rule: PropertyRule = {
  type: "SearchControlAddition",
}

let context: ConfigurationContext

describe("SearchControlAddition to XML", () => {
  beforeEach(() => {
    context = {
      ...mockContext,
      elementsTree: [{ name: "КакойТоЭлемент", itemType: "Table" }],
    }
  })
  describe("exportSearchControlAdditionToXML", () => {
    it("should return all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/searchControlAddition/full.xml").trimEnd()

      const xmlData = exportElementToXML({
        context: context,
        element: fullSearchControlAddition,
      })

      const result = xmlExport({ SearchControlAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/searchControlAddition/minimal.xml")
      const xmlData = exportElementToXML({
        context: context,
        element: minimalSearchControlAddition,
      })

      const result = xmlExport({ SearchControlAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })
  })

  describe("Single", () => {
    it("should return default when data is undefined", () => {
      const expectedResult = readXMLFileAsString("forms/searchControlAddition/minimalSingle.xml")

      const xmlData = exportPropertyToXML({
        context: context,
        rule: rule,
        value: undefined,
      })

      const result = xmlExport({ SearchControlAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })

    it("should return all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/searchControlAddition/fullSingle.xml").trimEnd()

      const xmlData = exportPropertyToXML({
        context: context,
        rule: rule,
        value: fullSingleSearchControlAddition,
      })

      const result = xmlExport({ SearchControlAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/searchControlAddition/minimalSingle.xml")
      const xmlData = exportPropertyToXML({
        context: context,
        rule: rule,
        value: minimalSingleSearchControlAddition,
      })

      const result = xmlExport({ SearchControlAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })
  })
})
