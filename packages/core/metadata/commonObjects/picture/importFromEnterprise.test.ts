import { describe, expect, it } from "vitest"
import { pictureTestCases } from "~/tests/fixtures/picture/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importPictureFromYAML } from "./fromYAML"

describe("importPictureFromYAML", () => {
  describe("importPictureFromYAML", () => {
    it("should return undefined for undefined input", () => {
      const result = importPictureFromYAML(mockContext, mockRule, undefined)

      expect(result).toBeUndefined()
    })

    it.each(pictureTestCases.filter((tc) => tc.fixture && tc.enterpriseImport !== false))(
      "should import $name from YAML",
      ({ pictureYAML, picture }) => {
        const result = importPictureFromYAML(mockContext, mockRule, pictureYAML)

        expect(result).toEqual(picture)
      }
    )
  })
  // describe("importPictureCombinedFromYAML", () => {
  //   it("should return undefined for undefined input", () => {
  //     const result = importPictureCombinedFromYAML(mockContext, mockRule,  undefined, undefined)

  //     expect(result).toBeUndefined()
  //   })

  //   it.each(pictureTestCases.filter((tc) => tc.fixture && tc.enterpriseImport !== false))(
  //     "should import $name from YAML",
  //     ({ pictureYAML, picture }) => {
  //       const result = importPictureCombinedFromYAML(mockContext, mockRule,  pictureYAML)

  //       expect(result).toEqual(picture)
  //     }
  //   )
  // })
})
