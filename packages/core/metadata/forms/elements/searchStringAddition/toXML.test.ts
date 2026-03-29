import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import {
  fullSearchStringAddition,
  fullSingleSearchStringAddition,
  minimalSearchStringAddition,
  minimalSingleSearchStringAddition,
} from "~/metadata/forms/elements/searchStringAddition/__fixtures__/data"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { testFixturesDir } from "~/tests/testFixturesDir"

const normalizeXML = (value: string): string => value.replace(/\s+/g, " ").trim()

const rule: PropertyRule = {
  type: "SingleSearchStringAddition",
  yaml: "ОтображениеСтрокиПоиска",
}

describe("SearchStringAddition to XML", () => {
  describe("Partial", () => {
    it("should return all fields to XML", () => {
      const { expectedResult, result } = testExportElementToXML({
        element: fullSearchStringAddition,
        path: "full.xml", baseDir: testFixturesDir(import.meta.url),
      })

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const { expectedResult, result } = testExportElementToXML({
        element: minimalSearchStringAddition,
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
        xmlRootTag: "SearchStringAddition",
        path: "minimalSingle.xml",
      importMetaUrl: import.meta.url,
        itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
      })

      expect(normalizeXML(result)).toEqual(normalizeXML(expectedResult))
    })

    it("should return all fields to XML", () => {
      const { expectedResult, result } = testExportPropertyToXML({
        rule,
        value: fullSingleSearchStringAddition,
        xmlRootTag: "SearchStringAddition",
        path: "fullSingle.xml",
      importMetaUrl: import.meta.url,
        itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
      })

      expect(normalizeXML(result)).toEqual(normalizeXML(expectedResult))
    })

    it("should export minimal", () => {
      const { expectedResult, result } = testExportPropertyToXML({
        rule,
        value: minimalSingleSearchStringAddition,
        xmlRootTag: "SearchStringAddition",
        path: "minimalSingle.xml",
      importMetaUrl: import.meta.url,
        itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
      })

      expect(normalizeXML(result)).toEqual(normalizeXML(expectedResult))
    })
  })
})
