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
import { importPictureFromEnterprise } from "./importFromEnterprise"

describe("importPictureFromEnterprise", () => {
  it("should import standard picture", () => {
    const result = importPictureFromEnterprise(mockСontext, standardPictureEnterprise)

    expect(result).toEqual(standardPicture)
  })

  it("should import common picture", () => {
    const result = importPictureFromEnterprise(mockСontext, commonPictureEnterprise)

    expect(result).toEqual(commonPicture)
  })

  it("should return undefined for undefined input", () => {
    const result = importPictureFromEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import common picture without transparent", () => {
    const result = importPictureFromEnterprise(mockСontext, coommomPictureWithoutTransparentEnterprise)

    expect(result).toEqual(coommomPictureWithoutTransparent)
  })

  it("should import standard picture without transparent", () => {
    const result = importPictureFromEnterprise(mockСontext, standardPictureWithoutTransparentEnterprise)

    expect(result).toEqual(standardPictureWithoutTransparent)
  })
})
