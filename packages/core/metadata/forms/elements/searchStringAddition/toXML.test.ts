import { beforeEach, describe, expect, it } from "vitest"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { exportElementToXML, exportPropertyToXML } from "~/metadata/orchestration"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import {
  fullSearchStringAddition,
  fullSingleSearchStringAddition,
  minimalSearchStringAddition,
  minimalSingleSearchStringAddition,
} from "~/tests/fixtures/forms/searchStringAddition/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

const rule: PropertyRule = {
  type: "SingleSearchStringAddition",
  yaml: "ОтображениеСтрокиПоиска",
}

let context: ConfigurationContextWithExportToXML

describe("SearchStringAddition to XML", () => {
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
  describe("Partial", () => {
    it("should return all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/searchStringAddition/full.xml").trimEnd()

      const xmlData = exportElementToXML({
        context: context,
        element: fullSearchStringAddition,
      })

      const result = xmlExport({ SearchStringAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/searchStringAddition/minimal.xml")
      const xmlData = exportElementToXML({
        context: context,
        element: minimalSearchStringAddition,
      })

      const result = xmlExport({ SearchStringAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })
  })

  describe("Single", () => {
    it("should return default when data is undefined", () => {
      const expectedResult = readXMLFileAsString("forms/searchStringAddition/minimalSingle.xml")

      const xmlData = exportPropertyToXML({
        context: context,
        rule: rule,
        value: undefined,
      })

      const result = xmlExport({ SearchStringAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })

    it("should return all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/searchStringAddition/fullSingle.xml").trimEnd()

      const xmlData = exportPropertyToXML({
        context: context,
        rule: rule,
        value: fullSingleSearchStringAddition,
      })

      const result = xmlExport({ SearchStringAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/searchStringAddition/minimalSingle.xml")
      const xmlData = exportPropertyToXML({
        context: context,
        rule: rule,
        value: minimalSingleSearchStringAddition,
      })

      const result = xmlExport({ SearchStringAddition: xmlData }, false)

      expect(result).toEqual(expectedResult)
    })
  })
})
