import { describe, expect, it } from "vitest"
import { fullAutoCommandBar, minimalAutoCommandBar } from "~/metadata/forms/elements/autoCommandBar/__fixtures__/data"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

import { readXMLFixtureAsString } from "~/tests/readFixtureXML"

describe("exportAutoCommandBarToXML", () => {
  describe("exportFormAutoCommandBarToXML", () => {
    it("should return default when data is undefined", () => {
      const expectedResult = readXMLFixtureAsString(import.meta.url, "minimalForm.xml")

      const { result } = testExportPropertyToXML({
        rule: { type: "AutoCommandBar" },
        value: undefined,
        xmlRootTag: "AutoCommandBar",
        path: "minimalForm.xml",
      importMetaUrl: import.meta.url,
      })

      expect(result).toEqual(expectedResult)
    })

    it("should return all fields to XML", () => {
      const expectedResult = readXMLFixtureAsString(import.meta.url, "fullForm.xml")

      const { result } = testExportPropertyToXML({
        rule: { type: "AutoCommandBar" },
        value: fullAutoCommandBar,
        xmlRootTag: "AutoCommandBar",
        path: "fullForm.xml",
      importMetaUrl: import.meta.url,
      })

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFixtureAsString(import.meta.url, "minimalForm.xml")

      const { result } = testExportPropertyToXML({
        rule: { type: "AutoCommandBar" },
        value: minimalAutoCommandBar,
        xmlRootTag: "AutoCommandBar",
        path: "minimalForm.xml",
      importMetaUrl: import.meta.url,
      })

      expect(result).toEqual(expectedResult)
    })
  })

  describe("exportTableAutoCommandBarToXML", () => {
    it("should return default when data is undefined", () => {
      const expectedResult = readXMLFixtureAsString(import.meta.url, "minimalTable.xml")

      const { result } = testExportPropertyToXML({
        rule: { type: "TableAutoCommandBar" },
        value: undefined,
        xmlRootTag: "AutoCommandBar",
        path: "minimalTable.xml",
      importMetaUrl: import.meta.url,
        itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
      })

      expect(result).toEqual(expectedResult)
    })

    it("should return all fields to XML", () => {
      const expectedResult = readXMLFixtureAsString(import.meta.url, "fullTable.xml")

      const { result } = testExportPropertyToXML({
        rule: { type: "TableAutoCommandBar" },
        value: fullAutoCommandBar,
        xmlRootTag: "AutoCommandBar",
        path: "fullTable.xml",
      importMetaUrl: import.meta.url,
        itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
      })

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFixtureAsString(import.meta.url, "minimalTable.xml")

      const { result } = testExportPropertyToXML({
        rule: { type: "TableAutoCommandBar" },
        value: minimalAutoCommandBar,
        xmlRootTag: "AutoCommandBar",
        path: "minimalTable.xml",
      importMetaUrl: import.meta.url,
        itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
      })

      expect(result).toEqual(expectedResult)
    })
  })
})
