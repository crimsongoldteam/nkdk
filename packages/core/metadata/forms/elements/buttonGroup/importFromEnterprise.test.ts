import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/button/importFromEnterprise"
import {
  fullButtonGroup,
  fullButtonGroupPartialEnterprise,
  fullButtonGroupTypedEnterprise,
  minimalButtonGroup,
  minimalButtonGroupTypedEnterprise,
} from "~/tests/fixtures/forms/buttonGroup/data"
import { mockСontext } from "~/tests/mockContext"
import { importButtonGroupPartialFromEnterprise, importButtonGroupTypedFromEnterprise } from "./importFromEnterprise"

describe("importButtonGroupFromEnterprise", () => {
  describe("importButtonGroupTypedFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importButtonGroupTypedFromEnterprise(mockСontext, undefined, "ГруппаКнопок")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importButtonGroupTypedFromEnterprise(mockСontext, fullButtonGroupTypedEnterprise, "ГруппаКнопок")

      expect(result).toEqual(fullButtonGroup)
    })

    it("should import minimal", () => {
      const result = importButtonGroupTypedFromEnterprise(
        mockСontext,
        minimalButtonGroupTypedEnterprise,
        "ГруппаКнопок"
      )

      expect(result).toEqual(minimalButtonGroup)
    })
  })

  describe("importButtonGroupPartialFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importButtonGroupPartialFromEnterprise(mockСontext, undefined, undefined)

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importButtonGroupPartialFromEnterprise(
        mockСontext,
        fullButtonGroup,
        fullButtonGroupPartialEnterprise
      )

      expect(result).toEqual(fullButtonGroup)
    })
  })
})
