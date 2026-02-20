import { describe, expect, it } from "vitest"
import { pictureTestCases } from "~/tests/fixtures/picture/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportPictureToYAML } from "./toYAML"
import { Picture } from "./types"

describe("exportPictureToYAML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportPictureToYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it.each(pictureTestCases)("should export $name to YAML", ({ picture, expectedYAML: enterpriseExpected }) => {
    const result = exportPictureToYAML(mockContext, mockRule, picture)

    expect(result).toEqual(enterpriseExpected)
  })

  it("should throw error when standard picture is not found", () => {
    const invalidStandardPicture = {
      ref: "NonExistentPicture",
      type: "StandardPicture",
      loadTransparent: true,
    } as Picture

    expect(() => {
      exportPictureToYAML(mockContext, mockRule, invalidStandardPicture)
    }).toThrowError()
  })
})
