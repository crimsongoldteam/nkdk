import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import {
import { testFixturesDir } from "~/tests/testFixturesDir"
  fullLabelField,
  fullTableLabelField,
  minimalLabelField,
  minimalTableLabelField,
} from "~/metadata/forms/elements/labelField/__fixtures__/data"

describe("exportLabelFieldToXML", () => {
  describe("LabelField", () => {
    it("should export all fields to XML", () => {
      const resultData = testExportElementToXML({
        element: fullLabelField,
        path: "full.xml", baseDir: testFixturesDir(import.meta.url),
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })

    it("should export minimal", () => {
      const resultData = testExportElementToXML({
        element: minimalLabelField,
        path: "minimal.xml", baseDir: testFixturesDir(import.meta.url),
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })
  })

  describe("TableLabelField", () => {
    it("should export all fields to XML", () => {
      const resultData = testExportElementToXML({
        element: fullTableLabelField,
        path: "fullTable.xml", baseDir: testFixturesDir(import.meta.url),
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })

    it("should export minimal", () => {
      const resultData = testExportElementToXML({
        element: minimalTableLabelField,
        path: "minimalTable.xml", baseDir: testFixturesDir(import.meta.url),
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })
  })
})
