import { describe, expect, it } from "vitest"
import "~/metadata/commonObjects/importFromEnterprise"
import "~/metadata/forms/elements/calendarField/rules"
import "~/metadata/forms/elements/importFromEnterprise"
import {
  fullCalendarField,
  fullCalendarFieldPartialEnterprise,
  fullCalendarFieldTypedEnterprise,
  minimalCalendarField,
  minimalCalendarFieldPartialEnterprise,
  minimalCalendarFieldTypedEnterprise,
} from "~/tests/fixtures/forms/calendarField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import {
  importCalendarFieldPartialFromEnterprise,
  importCalendarFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importCalendarFieldFromEnterprise", () => {
  describe("importCalendarFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importCalendarFieldTypedFromEnterprise(mockContext, mockRule, undefined, "ПолеКалендаря")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importCalendarFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        fullCalendarFieldTypedEnterprise,
        "ПолеКалендаря"
      )

      expect(result).toEqual(fullCalendarField)
    })

    it("should import minimal", () => {
      const result = importCalendarFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        minimalCalendarFieldTypedEnterprise,
        "ПолеКалендаря"
      )

      expect(result).toEqual(minimalCalendarField)
    })
  })

  describe("importCalendarFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importCalendarFieldPartialFromEnterprise(mockContext, mockRule,  undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importCalendarFieldPartialFromEnterprise(
        mockContext,
        mockRule,
        fullCalendarField,
        fullCalendarFieldPartialEnterprise
      )

      expect(result).toEqual(fullCalendarField)
    })

    it("should import minimal", () => {
      const result = importCalendarFieldPartialFromEnterprise(
        mockContext,
        mockRule,
        minimalCalendarField,
        minimalCalendarFieldPartialEnterprise
      )

      expect(result).toEqual(minimalCalendarField)
    })
  })
})
