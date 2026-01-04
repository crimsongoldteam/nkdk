import { describe, expect, it } from "vitest"
import {
  commonPicture,
  commonPictureEnterprise,
  coommomPictureWithoutTransparent,
  coommomPictureWithoutTransparentEnterprise,
  standardPicture,
  standardPictureEnterprise,
  standardPictureWithoutTransparent,
  standardPictureWithoutTransparentEnterprise,
} from "../../../tests/fixtures/picture/data"
import { mockСontext } from "../../../tests/mockContext"
import { exportPictureToEnterprise } from "./exportToEnterprise"
import { Picture } from "./types"

describe("exportPictureToEnterprise", () => {
  it("should format standard picture", () => {
    const result = exportPictureToEnterprise(mockСontext, standardPicture)

    expect(result).toEqual(standardPictureEnterprise)
  })

  it("should format common picture", () => {
    const result = exportPictureToEnterprise(mockСontext, commonPicture)

    expect(result).toEqual(commonPictureEnterprise)
  })

  it("should return undefined for undefined input", () => {
    const result = exportPictureToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export common picture without transparent", () => {
    const result = exportPictureToEnterprise(mockСontext, coommomPictureWithoutTransparent)

    expect(result).toEqual(coommomPictureWithoutTransparentEnterprise)
  })

  it("should export standard picture without transparent", () => {
    const result = exportPictureToEnterprise(mockСontext, standardPictureWithoutTransparent)

    expect(result).toEqual(standardPictureWithoutTransparentEnterprise)
  })

  it("should throw error when standard picture  is not found", () => {
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
