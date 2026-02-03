import { describe, expect, it } from "vitest"
import {
  fullCalendarField,
  fullCalendarFieldPartialEnterprise,
  fullCalendarFieldTypedEnterprise,
  minimalCalendarField,
  minimalCalendarFieldPartialEnterprise,
} from "~/tests/fixtures/forms/calendarField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportCalendarFieldPartialToEnterprise, exportCalendarFieldTypedToEnterprise } from "./exportToEnterprise"

describe("exportCalendarFieldToEnterprise", () => {
  describe("exportCalendarFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportCalendarFieldPartialToEnterprise(mockContext, mockRule, fullCalendarField)

      expect(result).toEqual(fullCalendarFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportCalendarFieldPartialToEnterprise(mockContext, mockRule, minimalCalendarField)

      expect(result).toEqual(minimalCalendarFieldPartialEnterprise)
    })
  })

  describe("exportCalendarFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportCalendarFieldTypedToEnterprise(mockContext, mockRule, fullCalendarField)

      expect(result).toEqual(fullCalendarFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportCalendarFieldTypedToEnterprise(mockContext, mockRule, undefined)

      expect(result).toBeUndefined()
    })
  })
})
