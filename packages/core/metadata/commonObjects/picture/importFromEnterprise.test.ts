import { describe, expect, it } from "vitest"
import { pictureTestCases } from "~/tests/fixtures/picture/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importPictureFromEnterprise } from "./importFromEnterprise"

describe("importPictureFromEnterprise", () => {
  describe("importPictureFromEnterprise", () => {
    it("should return undefined for undefined input", () => {
      const result = importPictureFromEnterprise(mockContext, mockRule, undefined)

      expect(result).toBeUndefined()
    })

    it.each(pictureTestCases.filter((tc) => tc.fixture && tc.enterpriseImport !== false))(
      "should import $name from Enterprise",
      ({ pictureEnterprise, picture }) => {
        const result = importPictureFromEnterprise(mockContext, mockRule, pictureEnterprise)

        expect(result).toEqual(picture)
      }
    )
  })
  // describe("importPictureCombinedFromEnterprise", () => {
  //   it("should return undefined for undefined input", () => {
  //     const result = importPictureCombinedFromEnterprise(mockContext, mockRule,  undefined, undefined)

  //     expect(result).toBeUndefined()
  //   })

  //   it.each(pictureTestCases.filter((tc) => tc.fixture && tc.enterpriseImport !== false))(
  //     "should import $name from Enterprise",
  //     ({ pictureEnterprise, picture }) => {
  //       const result = importPictureCombinedFromEnterprise(mockContext, mockRule,  pictureEnterprise)

  //       expect(result).toEqual(picture)
  //     }
  //   )
  // })
})
