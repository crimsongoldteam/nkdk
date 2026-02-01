import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/button/importFromEnterprise"
import {
  fullButtonGroup,
  fullButtonGroupPartialEnterprise,
  fullButtonGroupTypedEnterprise,
  minimalButtonGroup,
  minimalButtonGroupTypedEnterprise,
} from "~/tests/fixtures/forms/buttonGroup/data"
import { mockContext } from "~/tests/mockContext"
import { importButtonGroupPartialFromEnterprise, importButtonGroupTypedFromEnterprise } from "./importFromEnterprise"

describe("importButtonGroupFromEnterprise", () => {
  describe("importButtonGroupTypedFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importButtonGroupTypedFromEnterprise(mockContext, undefined, "ГруппаКнопок")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importButtonGroupTypedFromEnterprise(mockContext, fullButtonGroupTypedEnterprise, "ГруппаКнопок")

      expect(result).toEqual(fullButtonGroup)
    })

    it("should import minimal", () => {
      const result = importButtonGroupTypedFromEnterprise(
        mockContext,
        minimalButtonGroupTypedEnterprise,
        "ГруппаКнопок"
      )

      expect(result).toEqual(minimalButtonGroup)
    })
  })

  describe("importButtonGroupPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importButtonGroupPartialFromEnterprise(mockContext, undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importButtonGroupPartialFromEnterprise(
        mockContext,
        fullButtonGroup,
        fullButtonGroupPartialEnterprise
      )

      expect(result).toEqual(fullButtonGroup)
    })
  })
})
