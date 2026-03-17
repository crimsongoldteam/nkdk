import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/exportElementToXML"
import {
  fullLabelField,
  fullTableLabelField,
  minimalLabelField,
  minimalTableLabelField,
} from "~/tests/fixtures/forms/labelField/data"

describe("exportLabelFieldToXML", () => {
  describe("LabelField", () => {
    it("should export all fields to XML", () => {
      const resultData = testExportElementToXML({
        element: fullLabelField,
        path: "forms/labelField/full.xml",
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })

    it("should export minimal", () => {
      const resultData = testExportElementToXML({
        element: minimalLabelField,
        path: "forms/labelField/minimal.xml",
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })
  })

  describe("TableLabelField", () => {
    it("should export all fields to XML", () => {
      const resultData = testExportElementToXML({
        element: fullTableLabelField,
        path: "forms/labelField/fullTable.xml",
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })

    it("should export minimal", () => {
      const resultData = testExportElementToXML({
        element: minimalTableLabelField,
        path: "forms/labelField/minimalTable.xml",
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })
  })
})
