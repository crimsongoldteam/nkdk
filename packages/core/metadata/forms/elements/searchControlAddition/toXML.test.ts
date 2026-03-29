import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import {
  fullSearchControlAddition,
  fullSingleSearchControlAddition,
  minimalSearchControlAddition,
  minimalSingleSearchControlAddition,
} from "~/metadata/forms/elements/searchControlAddition/__fixtures__/data"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { testFixturesDir } from "~/tests/testFixturesDir"

const rule: PropertyRule = {
  type: "SingleSearchControlAddition",
}

describe("SearchControlAddition to XML", () => {
  describe("exportSearchControlAdditionToXML", () => {
    it("should return all fields to XML", () => {
      const { expectedResult, result } = testExportElementToXML({
        element: fullSearchControlAddition,
        path: "full.xml", baseDir: testFixturesDir(import.meta.url),
      })

      expect(result).toEqual(expectedResult.trimEnd())
    })

    it("should export minimal", () => {
      const { expectedResult, result } = testExportElementToXML({
        element: minimalSearchControlAddition,
        path: "minimal.xml", baseDir: testFixturesDir(import.meta.url),
      })

      expect(result).toEqual(expectedResult)
    })
  })

  describe("Single", () => {
    it("should return default when data is undefined", () => {
      const { expectedResult, result } = testExportPropertyToXML({
        rule,
        value: undefined,
        xmlRootTag: "SearchControlAddition",
        path: "minimalSingle.xml",
      importMetaUrl: import.meta.url,
        itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
      })

      expect(result).toEqual(expectedResult)
    })

    it("should return all fields to XML", () => {
      const { expectedResult, result } = testExportPropertyToXML({
        rule,
        value: fullSingleSearchControlAddition,
        xmlRootTag: "SearchControlAddition",
        path: "fullSingle.xml",
      importMetaUrl: import.meta.url,
        itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
      })

      expect(result).toEqual(expectedResult.trimEnd())
    })

    it("should export minimal", () => {
      const { expectedResult, result } = testExportPropertyToXML({
        rule,
        value: minimalSingleSearchControlAddition,
        xmlRootTag: "SearchControlAddition",
        path: "minimalSingle.xml",
      importMetaUrl: import.meta.url,
        itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
      })

      expect(result).toEqual(expectedResult)
    })
  })
})
