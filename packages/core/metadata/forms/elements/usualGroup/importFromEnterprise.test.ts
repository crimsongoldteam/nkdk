import { describe, expect, it } from "vitest"
import { fullUsualGroup, fullUsualGroupPartialEnterprise } from "~/tests/fixtures/forms/usualGroup/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importUsualGroupPartialFromEnterprise } from "./importFromEnterprise"

describe("importUsualGroupFromEnterprise", () => {
  describe("importUsualGroupPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importUsualGroupPartialFromEnterprise(
        mockContext,
        mockRule,
        fullUsualGroup,
        fullUsualGroupPartialEnterprise
      )

      expect(result).toEqual(fullUsualGroup)
    })
  })
})
