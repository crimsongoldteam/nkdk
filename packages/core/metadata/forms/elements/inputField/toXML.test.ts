import { describe, expect, it } from "vitest"
import {
  fullInputField,
  fullTableInputField,
  minimalInputField,
  minimalTableInputField,
} from "~/metadata/forms/elements/inputField/__fixtures__/data"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"

describe("exportInputFieldToXML", () => {
  describe("InputField", () => {
    it("should export all fields to XML", () => {
      const resultData = testExportElementToXML({
        element: fullInputField,
        path: "forms/inputField/full.xml",
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })

    it("should export minimal", () => {
      const resultData = testExportElementToXML({
        element: minimalInputField,
        path: "forms/inputField/minimal.xml",
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })
  })

  describe("TableInputField", () => {
    it("should export all fields to XML", () => {
      const resultData = testExportElementToXML({
        element: fullTableInputField,
        path: "forms/inputField/fullTable.xml",
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })

    it("should export minimal", () => {
      const resultData = testExportElementToXML({
        element: minimalTableInputField,
        path: "forms/inputField/minimalTable.xml",
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })
  })
})
