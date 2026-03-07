import { beforeEach, describe, expect, it } from "vitest"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { exportElementToXML, exportPropertyToXML } from "~/metadata/orchestration"
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
  type: "SingleSearchControlAddition",
}

let context: ConfigurationContextWithExportToXML

describe("SearchControlAddition to XML", () => {
  beforeEach(() => {
    context = {
      ...mockContext,
      exportToXML: {
        itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
        configDumpInfo: new Map(),
        version: "2.20",
      },
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
