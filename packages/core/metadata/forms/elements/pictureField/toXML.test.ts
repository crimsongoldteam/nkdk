import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import {
  fullPictureField,
  fullTablePictureField,
  minimalPictureField,
  minimalTablePictureField,
} from "~/tests/fixtures/forms/pictureField/data"

describe("exportPictureFieldToXML", () => {
  describe("PictureField", () => {
    it("should export all fields to XML", () => {
      const resultData = testExportElementToXML({
        element: fullPictureField,
        path: "forms/pictureField/full.xml",
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })

    it("should export minimal", () => {
      const resultData = testExportElementToXML({
        element: minimalPictureField,
        path: "forms/pictureField/minimal.xml",
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })
  })

  describe("TablePictureField", () => {
    it("should export all fields to XML", () => {
      const resultData = testExportElementToXML({
        element: fullTablePictureField,
        path: "forms/pictureField/fullTable.xml",
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })

    it("should export minimal", () => {
      const resultData = testExportElementToXML({
        element: minimalTablePictureField,
        path: "forms/pictureField/minimalTable.xml",
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })
  })
})
