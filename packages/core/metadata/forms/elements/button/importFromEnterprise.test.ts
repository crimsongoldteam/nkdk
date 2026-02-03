import { describe, expect, it } from "vitest"
import {
  fullButton,
  fullButtonPartialEnterprise,
  fullButtonTypedEnterprise,
  minimalButton,
  minimalButtonTypedEnterprise,
} from "~/tests/fixtures/forms/button/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importButtonPartialFromEnterprise, importButtonTypedFromEnterprise } from "./importFromEnterprise"

describe("importButtonTypedFromEnterprise", () => {
  describe("importButtonTypedFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importButtonTypedFromEnterprise(mockContext, mockRule, fullButtonTypedEnterprise, "Кнопка")

      expect(result).toEqual(fullButton)
    })

    it("should import minimal", () => {
      const result = importButtonTypedFromEnterprise(mockContext, mockRule, minimalButtonTypedEnterprise, "Кнопка")

      expect(result).toEqual(minimalButton)
    })
  })

  describe("importButtonPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importButtonPartialFromEnterprise(mockContext, mockRule, fullButton, fullButtonPartialEnterprise)

      expect(result).toEqual(fullButton)
    })
  })
})
