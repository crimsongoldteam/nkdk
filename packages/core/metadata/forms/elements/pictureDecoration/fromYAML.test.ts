import { describe, expect, it } from "vitest"
import {
  fullPictureDecoration,
  fullPictureDecorationPartialEnterprise,
  fullPictureDecorationTypedEnterprise,
  minimalPictureDecoration,
  minimalPictureDecorationTypedEnterprise,
} from "~/tests/fixtures/forms/pictureDecoration/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import {
  importPictureDecorationPartialFromEnterprise,
  importPictureDecorationTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importPictureDecorationFromEnterprise", () => {
  describe("importPictureDecorationTypedFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importPictureDecorationTypedFromEnterprise(mockContext, mockRule, undefined, "ДекорацияКартинки")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importPictureDecorationTypedFromEnterprise(
        mockContext,
        mockRule,
        fullPictureDecorationTypedEnterprise,
        "ДекорацияКартинки"
      )

      expect(result).toEqual(fullPictureDecoration)
    })

    it("should import minimal", () => {
      const result = importPictureDecorationTypedFromEnterprise(
        mockContext,
        mockRule,
        minimalPictureDecorationTypedEnterprise,
        "ДекорацияКартинки"
      )

      expect(result).toEqual(minimalPictureDecoration)
    })
  })

  describe("importPictureDecorationPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importPictureDecorationPartialFromEnterprise(mockContext, mockRule,  undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importPictureDecorationPartialFromEnterprise(
        mockContext,
        mockRule,
        fullPictureDecoration,
        fullPictureDecorationPartialEnterprise
      )

      expect(result).toEqual(fullPictureDecoration)
    })
  })
})
