import { describe, expect, it } from "vitest"
import {
  commonPicture,
  commonPictureEnterprise,
  standardPicture,
  standardPictureEnterprise,
  withoutTransparentPicture,
  withoutTransparentPictureEnterprise,
} from "../../../tests/fixtures/picture/data"
import { mockСontext } from "../../../tests/mockContext"
import { exportPictureToEnterprise } from "./exportToEnterprise"

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

  it("should export picture without transparent", () => {
    const result = exportPictureToEnterprise(mockСontext, withoutTransparentPicture)

    expect(result).toEqual(withoutTransparentPictureEnterprise)
  })
})
