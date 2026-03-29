import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import {
import { testFixturesDir } from "~/tests/testFixturesDir"
  fullCheckBoxField,
  fullTableCheckBoxField,
  minimalCheckBoxField,
  minimalTableCheckBoxField,
} from "~/metadata/forms/elements/checkBoxField/__fixtures__/data"

describe("exportCheckBoxFieldToXML", () => {
  describe("CheckBoxField", () => {
    it("should export all fields to XML", () => {
      const resultData = testExportElementToXML({
        element: fullCheckBoxField,
        path: "full.xml", baseDir: testFixturesDir(import.meta.url),
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })

    it("should export minimal", () => {
      const resultData = testExportElementToXML({
        element: minimalCheckBoxField,
        path: "minimal.xml", baseDir: testFixturesDir(import.meta.url),
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })
  })

  describe("TableCheckBoxField", () => {
    it("should export all fields to XML", () => {
      const resultData = testExportElementToXML({
        element: fullTableCheckBoxField,
        path: "fullTable.xml", baseDir: testFixturesDir(import.meta.url),
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })

    it("should export minimal", () => {
      const resultData = testExportElementToXML({
        element: minimalTableCheckBoxField,
        path: "minimalTable.xml", baseDir: testFixturesDir(import.meta.url),
      })

      expect(resultData.result).toEqual(resultData.expectedResult)
    })
  })
})
