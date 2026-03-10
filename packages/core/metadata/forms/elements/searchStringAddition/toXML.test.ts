import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import {
  fullSearchStringAddition,
  fullSingleSearchStringAddition,
  minimalSearchStringAddition,
  minimalSingleSearchStringAddition,
} from "~/tests/fixtures/forms/searchStringAddition/data"
import { testExportElementToXML, testExportPropertyToXML } from "~/tests/exportElementToXML"

const rule: PropertyRule = {
  type: "SingleSearchStringAddition",
  yaml: "ОтображениеСтрокиПоиска",
}

describe("SearchStringAddition to XML", () => {
  describe("Partial", () => {
    it("should return all fields to XML", () => {
      const { expectedResult, result } = testExportElementToXML({
        element: fullSearchStringAddition,
        path: "forms/searchStringAddition/full.xml",
      })

      expect(result).toEqual(expectedResult.trimEnd())
    })

    it("should export minimal", () => {
      const { expectedResult, result } = testExportElementToXML({
        element: minimalSearchStringAddition,
        path: "forms/searchStringAddition/minimal.xml",
      })

      expect(result).toEqual(expectedResult)
    })
  })

  describe("Single", () => {
    it("should return default when data is undefined", () => {
      const { expectedResult, result } = testExportPropertyToXML({
        rule,
        value: undefined,
        xmlRootTag: "SearchStringAddition",
        path: "forms/searchStringAddition/minimalSingle.xml",
        itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
      })

      expect(result).toEqual(expectedResult)
    })

    it("should return all fields to XML", () => {
      const { expectedResult, result } = testExportPropertyToXML({
        rule,
        value: fullSingleSearchStringAddition,
        xmlRootTag: "SearchStringAddition",
        path: "forms/searchStringAddition/fullSingle.xml",
        itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
      })

      expect(result).toEqual(expectedResult.trimEnd())
    })

    it("should export minimal", () => {
      const { expectedResult, result } = testExportPropertyToXML({
        rule,
        value: minimalSingleSearchStringAddition,
        xmlRootTag: "SearchStringAddition",
        path: "forms/searchStringAddition/minimalSingle.xml",
        itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
      })

      expect(result).toEqual(expectedResult)
    })
  })
})
