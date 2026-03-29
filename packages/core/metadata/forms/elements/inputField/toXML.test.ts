import { describe, expect, it } from "vitest"
import {
  fullInputField,
  fullTableInputField,
  minimalInputField,
  minimalTableInputField,
} from "~/metadata/forms/elements/inputField/__fixtures__/data"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import { testFixturesDir } from "~/tests/testFixturesDir"

describe("exportInputFieldToXML", () => {
  describe("InputField", () => {
    it("should export all fields to XML", () => {
      const resultData = testExportElementToXML({
        element: fullInputField,
        path: "full.xml", baseDir: testFixturesDir(import.meta.url),
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })

    it("should export minimal", () => {
      const resultData = testExportElementToXML({
        element: minimalInputField,
        path: "minimal.xml", baseDir: testFixturesDir(import.meta.url),
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })
  })

  describe("TableInputField", () => {
    it("should export all fields to XML", () => {
      const resultData = testExportElementToXML({
        element: fullTableInputField,
        path: "fullTable.xml", baseDir: testFixturesDir(import.meta.url),
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })

    it("should export minimal", () => {
      const resultData = testExportElementToXML({
        element: minimalTableInputField,
        path: "minimalTable.xml", baseDir: testFixturesDir(import.meta.url),
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })
  })
})
