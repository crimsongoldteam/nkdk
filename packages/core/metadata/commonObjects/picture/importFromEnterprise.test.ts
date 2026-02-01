import { describe, expect, it } from "vitest"
import { pictureTestCases } from "~/tests/fixtures/picture/data"
import { mockContext } from "~/tests/mockContext"
import { importPictureFromEnterprise } from "./importFromEnterprise"

describe("importPictureFromEnterprise", () => {
  describe("importPictureFromEnterprise", () => {
    it("should return undefined for undefined input", () => {
      const result = importPictureFromEnterprise(mockContext, undefined)

      expect(result).toBeUndefined()
    })

    it.each(pictureTestCases.filter((tc) => tc.fixture && tc.enterpriseImport !== false))(
      "should import $name from Enterprise",
      ({ pictureEnterprise, picture }) => {
        const result = importPictureFromEnterprise(mockContext, pictureEnterprise)

        expect(result).toEqual(picture)
      }
    )
  })
  // describe("importPictureCombinedFromEnterprise", () => {
  //   it("should return undefined for undefined input", () => {
  //     const result = importPictureCombinedFromEnterprise(mockContext, undefined, undefined)

  //     expect(result).toBeUndefined()
  //   })

  //   it.each(pictureTestCases.filter((tc) => tc.fixture && tc.enterpriseImport !== false))(
  //     "should import $name from Enterprise",
  //     ({ pictureEnterprise, picture }) => {
  //       const result = importPictureCombinedFromEnterprise(mockContext, pictureEnterprise)

  //       expect(result).toEqual(picture)
  //     }
  //   )
  // })
})
