import { describe, expect, it } from "vitest"
import {
  fullPopup,
  fullPopupPartialEnterprise,
  fullPopupTypedEnterprise,
  minimalPopup,
  minimalPopupPartialEnterprise,
  minimalPopupTypedEnterprise,
} from "~/tests/fixtures/forms/popup/data"
import { mockСontext } from "~/tests/mockContext"
import {
  exportPopupPartialToEnterprise,
  exportPopupTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportPopupToEnterprise", () => {
  describe("exportPopupPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportPopupPartialToEnterprise(mockСontext, fullPopup)

      expect(result).toEqual(fullPopupPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportPopupPartialToEnterprise(mockСontext, minimalPopup)

      expect(result).toEqual(minimalPopupPartialEnterprise)
    })
  })

  describe("exportPopupTypedToEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = exportPopupTypedToEnterprise(mockСontext, undefined)

      expect(result).toBeUndefined()
    })

    it("should export all fields to Enterprise", () => {
      const result = exportPopupTypedToEnterprise(mockСontext, fullPopup)

      expect(result).toEqual(fullPopupTypedEnterprise)
    })

    it("should export minimal", () => {
      const result = exportPopupTypedToEnterprise(mockСontext, minimalPopup)

      expect(result).toEqual(minimalPopupTypedEnterprise)
    })
  })
})


