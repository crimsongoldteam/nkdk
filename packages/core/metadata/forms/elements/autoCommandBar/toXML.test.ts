import { describe, expect, it } from "vitest"
import { fullAutoCommandBar, minimalAutoCommandBar } from "~/tests/fixtures/forms/autoCommandBar/data"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"

describe("exportAutoCommandBarToXML", () => {
  describe("exportFormAutoCommandBarToXML", () => {
    it("should return default when data is undefined", () => {
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/minimalForm.xml")

      const { result } = testExportPropertyToXML({
        rule: { type: "AutoCommandBar" },
        value: undefined,
        xmlRootTag: "AutoCommandBar",
        path: "forms/autoCommandBar/minimalForm.xml",
      })

      expect(result).toEqual(expectedResult)
    })

    it("should return all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/fullForm.xml")

      const { result } = testExportPropertyToXML({
        rule: { type: "AutoCommandBar" },
        value: fullAutoCommandBar,
        xmlRootTag: "AutoCommandBar",
        path: "forms/autoCommandBar/fullForm.xml",
      })

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/minimalForm.xml")

      const { result } = testExportPropertyToXML({
        rule: { type: "AutoCommandBar" },
        value: minimalAutoCommandBar,
        xmlRootTag: "AutoCommandBar",
        path: "forms/autoCommandBar/minimalForm.xml",
      })

      expect(result).toEqual(expectedResult)
    })
  })

  describe("exportTableAutoCommandBarToXML", () => {
    it("should return default when data is undefined", () => {
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/minimalTable.xml")

      const { result } = testExportPropertyToXML({
        rule: { type: "TableAutoCommandBar" },
        value: undefined,
        xmlRootTag: "AutoCommandBar",
        path: "forms/autoCommandBar/minimalTable.xml",
        itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
      })

      expect(result).toEqual(expectedResult)
    })

    it("should return all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/fullTable.xml")

      const { result } = testExportPropertyToXML({
        rule: { type: "TableAutoCommandBar" },
        value: fullAutoCommandBar,
        xmlRootTag: "AutoCommandBar",
        path: "forms/autoCommandBar/fullTable.xml",
        itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
      })

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/minimalTable.xml")

      const { result } = testExportPropertyToXML({
        rule: { type: "TableAutoCommandBar" },
        value: minimalAutoCommandBar,
        xmlRootTag: "AutoCommandBar",
        path: "forms/autoCommandBar/minimalTable.xml",
        itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
      })

      expect(result).toEqual(expectedResult)
    })
  })
})
