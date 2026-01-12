import { describe, expect, it } from "vitest"
import {
  fullFormDecoration,
  fullFormDecorationPartialEnterprise,
  fullFormDecorationTypedEnterprise,
  minimalFormDecoration,
  minimalFormDecorationPartialEnterprise,
  minimalFormDecorationTypedEnterprise,
} from "~/tests/fixtures/forms/formDecoration/data"
import { mockСontext } from "~/tests/mockContext"
import {
  importFormDecorationPartialFromEnterprise,
  importFormDecorationTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importFormDecorationFromEnterprise", () => {
  describe("importFormDecorationTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importFormDecorationTypedFromEnterprise(mockСontext, undefined, "КакаяТоДекорацияФормы")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importFormDecorationTypedFromEnterprise(
        mockСontext,
        fullFormDecorationTypedEnterprise,
        "КакаяТоДекорацияФормы"
      )

      expect(result).toEqual(fullFormDecoration)
    })

    it("should import minimal", () => {
      const result = importFormDecorationTypedFromEnterprise(
        mockСontext,
        minimalFormDecorationTypedEnterprise,
        "ОформлениеФормы"
      )

      expect(result).toEqual(minimalFormDecoration)
    })
  })

  describe("importFormDecorationPartialFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importFormDecorationPartialFromEnterprise(mockСontext, undefined, undefined)

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importFormDecorationPartialFromEnterprise(
        mockСontext,
        fullFormDecoration,
        fullFormDecorationPartialEnterprise
      )

      expect(result).toEqual(fullFormDecoration)
    })

    it("should import minimal", () => {
      const result = importFormDecorationPartialFromEnterprise(
        mockСontext,
        minimalFormDecoration,
        minimalFormDecorationPartialEnterprise
      )

      expect(result).toEqual(minimalFormDecoration)
    })
  })
})
