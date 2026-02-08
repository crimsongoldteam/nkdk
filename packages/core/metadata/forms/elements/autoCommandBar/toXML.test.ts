import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportPropertyToXML } from "~/metadata/metadataFactory"
import { fullAutoCommandBar, minimalAutoCommandBar } from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockContext } from "~/tests/mockContext"
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
  const context: ConfigurationContext =
    type === "AutoCommandBar" ? mockContext : { ...mockContext, elementContext: { name: "КакойТоЭлемент" } }

  const xmlData = exportPropertyToXML({
    context: context,
    key: "AutoCommandBar",
    rule: { type: type },
    value: value,
  })

  const result = xmlExport({ AutoCommandBar: xmlData ? xmlData["AutoCommandBar"] : undefined }, false)

  return result
}
