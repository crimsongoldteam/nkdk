import { describe, expect, it } from "vitest"
import {
  fullButton,
  fullButtonPartialEnterprise,
  fullButtonTypedEnterprise,
  minimalButton,
  minimalButtonTypedEnterprise,
} from "~/tests/fixtures/forms/button/data"
import { mockСontext } from "~/tests/mockContext"
import { importButtonPartialFromEnterprise, importButtonTypedFromEnterprise } from "./importFromEnterprise"

describe("importButtonTypedFromEnterprise", () => {
  describe("importButtonTypedFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importButtonTypedFromEnterprise(mockСontext, fullButtonTypedEnterprise, "Кнопка")

      expect(result).toEqual(fullButton)
    })

    it("should import minimal", () => {
      const result = importButtonTypedFromEnterprise(mockСontext, minimalButtonTypedEnterprise, "Кнопка")

      expect(result).toEqual(minimalButton)
    })
  })

  describe("importButtonPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importButtonPartialFromEnterprise(mockСontext, fullButton, fullButtonPartialEnterprise)

      expect(result).toEqual(fullButton)
    })
  })
})
