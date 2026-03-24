import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import {
  fullCheckBoxField,
  fullTableCheckBoxField,
  minimalCheckBoxField,
  minimalTableCheckBoxField,
} from "~/tests/fixtures/forms/checkBoxField/data"

describe("exportCheckBoxFieldToXML", () => {
  describe("CheckBoxField", () => {
    it("should export all fields to XML", () => {
      const resultData = testExportElementToXML({
        element: fullCheckBoxField,
        path: "forms/checkBoxField/full.xml",
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })

    it("should export minimal", () => {
      const resultData = testExportElementToXML({
        element: minimalCheckBoxField,
        path: "forms/checkBoxField/minimal.xml",
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })
  })

  describe("TableCheckBoxField", () => {
    it("should export all fields to XML", () => {
      const resultData = testExportElementToXML({
        element: fullTableCheckBoxField,
        path: "forms/checkBoxField/fullTable.xml",
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })

    it("should export minimal", () => {
      const resultData = testExportElementToXML({
        element: minimalTableCheckBoxField,
        path: "forms/checkBoxField/minimalTable.xml",
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })
  })
})
