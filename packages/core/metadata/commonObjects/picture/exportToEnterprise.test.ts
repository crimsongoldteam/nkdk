import { describe, expect, it } from "vitest"
import { pictureTestCases } from "~/tests/fixtures/picture/data"
import { mockСontext } from "~/tests/mockContext"
import { exportPictureToEnterprise } from "./exportToEnterprise"
import { Picture } from "./types"

describe("exportPictureToEnterprise", () => {
  it("should return undefined for undefined input", () => {
    const result = exportPictureToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it.each(pictureTestCases)(
    "should export $name to Enterprise",
    ({ picture, enterpriseExpected }) => {
      const result = exportPictureToEnterprise(mockСontext, picture)

      expect(result).toEqual(enterpriseExpected)
    }
  )

  it("should throw error when standard picture is not found", () => {
    const invalidStandardPicture = {
      ref: "NonExistentPicture",
      type: "StandardPicture",
      loadTransparent: true,
    } as Picture

    expect(() => {
      exportPictureToEnterprise(mockСontext, invalidStandardPicture)
    }).toThrowError()
  })
})
