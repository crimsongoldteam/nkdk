import { describe, expect, it } from "vitest"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { exportPropertyToXML } from "~/metadata/orchestration"
import { fullAutoCommandBar, minimalAutoCommandBar } from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockContext, mockContextToXML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { AutoCommandBar } from "./types"

describe("exportAutoCommandBarToXML", () => {
  describe("exportFormAutoCommandBarToXML", () => {
    it("should return default when data is undefined", () => {
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/minimalForm.xml")

      const result = exportToXML(undefined, "AutoCommandBar")

      expect(result).toEqual(expectedResult)
    })

    it("should return all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/fullForm.xml")

      const result = exportToXML(fullAutoCommandBar, "AutoCommandBar")

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/minimalForm.xml")

      const result = exportToXML(minimalAutoCommandBar, "AutoCommandBar")

      expect(result).toEqual(expectedResult)
    })
  })

  describe("exportTableAutoCommandBarToXML", () => {
    it("should return default when data is undefined", () => {
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/minimalTable.xml")

      const result = exportToXML(undefined, "TableAutoCommandBar")

      expect(result).toEqual(expectedResult)
    })

    it("should return all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/fullTable.xml")

      const result = exportToXML(fullAutoCommandBar, "TableAutoCommandBar")

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/autoCommandBar/minimalTable.xml")

      const result = exportToXML(minimalAutoCommandBar, "TableAutoCommandBar")

      expect(result).toEqual(expectedResult)
    })
  })
})

const exportToXML = (value: AutoCommandBar | undefined, type: "AutoCommandBar" | "TableAutoCommandBar"): string => {
  const context: ConfigurationContextWithExportToXML =
    type === "AutoCommandBar"
      ? mockContextToXML()
      : {
          ...mockContext,
          exportToXML: {
            ...mockContextToXML().exportToXML,
            itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
          },
        }

  const xmlData = exportPropertyToXML({
    context: context,
    rule: { type: type },
    value: value,
  })

  const result = xmlExport({ AutoCommandBar: xmlData }, false)

  return result
}
