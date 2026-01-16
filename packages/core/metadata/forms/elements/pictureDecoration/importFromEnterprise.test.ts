import { describe, expect, it } from "vitest"
import {
  fullPictureDecoration,
  fullPictureDecorationPartialEnterprise,
  fullPictureDecorationTypedEnterprise,
  minimalPictureDecoration,
  minimalPictureDecorationTypedEnterprise,
} from "~/tests/fixtures/forms/pictureDecoration/data"
import { mockСontext } from "~/tests/mockContext"
import {
  importPictureDecorationPartialFromEnterprise,
  importPictureDecorationTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importPictureDecorationFromEnterprise", () => {
  describe("importPictureDecorationTypedFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importPictureDecorationTypedFromEnterprise(mockСontext, undefined, "ДекорацияКартинки")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importPictureDecorationTypedFromEnterprise(
        mockСontext,
        fullPictureDecorationTypedEnterprise,
        "ДекорацияКартинки"
      )

      expect(result).toEqual(fullPictureDecoration)
    })

    it("should import minimal", () => {
      const result = importPictureDecorationTypedFromEnterprise(
        mockСontext,
        minimalPictureDecorationTypedEnterprise,
        "ДекорацияКартинки"
      )

      expect(result).toEqual(minimalPictureDecoration)
    })
  })

  describe("importPictureDecorationPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importPictureDecorationPartialFromEnterprise(mockСontext, undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importPictureDecorationPartialFromEnterprise(
        mockСontext,
        fullPictureDecoration,
        fullPictureDecorationPartialEnterprise
      )

      expect(result).toEqual(fullPictureDecoration)
    })
  })
})
