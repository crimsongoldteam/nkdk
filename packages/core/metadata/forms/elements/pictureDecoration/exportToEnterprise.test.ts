import { describe, expect, it } from "vitest"
import {
  fullPictureDecoration,
  fullPictureDecorationPartialEnterprise,
  fullPictureDecorationTypedEnterprise,
  minimalPictureDecoration,
  minimalPictureDecorationPartialEnterprise,
  minimalPictureDecorationTypedEnterprise,
} from "~/tests/fixtures/forms/pictureDecoration/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import {
  exportPictureDecorationPartialToEnterprise,
  exportPictureDecorationTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportPictureDecorationPartialToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportPictureDecorationPartialToEnterprise(mockContext, mockRule, fullPictureDecoration)

    expect(result).toEqual(fullPictureDecorationPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportPictureDecorationPartialToEnterprise(mockContext, mockRule, minimalPictureDecoration)

    expect(result).toEqual(minimalPictureDecorationPartialEnterprise)
  })
})

describe("exportPictureDecorationTypedToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportPictureDecorationTypedToEnterprise(mockContext, mockRule, fullPictureDecoration)

    expect(result).toEqual(fullPictureDecorationTypedEnterprise)
  })

  it("should return undefined when data is undefined", () => {
    const result = exportPictureDecorationTypedToEnterprise(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export minimal", () => {
    const result = exportPictureDecorationTypedToEnterprise(mockContext, mockRule, minimalPictureDecoration)

    expect(result).toEqual(minimalPictureDecorationTypedEnterprise)
  })
})
