import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import {
import { testFixturesDir } from "~/tests/testFixturesDir"
  fullPictureField,
  fullTablePictureField,
  minimalPictureField,
  minimalTablePictureField,
} from "~/metadata/forms/elements/pictureField/__fixtures__/data"

describe("exportPictureFieldToXML", () => {
  describe("PictureField", () => {
    it("should export all fields to XML", () => {
      const resultData = testExportElementToXML({
        element: fullPictureField,
        path: "full.xml", baseDir: testFixturesDir(import.meta.url),
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })

    it("should export minimal", () => {
      const resultData = testExportElementToXML({
        element: minimalPictureField,
        path: "minimal.xml", baseDir: testFixturesDir(import.meta.url),
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })
  })

  describe("TablePictureField", () => {
    it("should export all fields to XML", () => {
      const resultData = testExportElementToXML({
        element: fullTablePictureField,
        path: "fullTable.xml", baseDir: testFixturesDir(import.meta.url),
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })

    it("should export minimal", () => {
      const resultData = testExportElementToXML({
        element: minimalTablePictureField,
        path: "minimalTable.xml", baseDir: testFixturesDir(import.meta.url),
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })
  })
})
