import { describe, expect, it } from "vitest"
import {
  fullCalendarField,
  fullCalendarFieldPartialEnterprise,
  minimalCalendarField,
  minimalCalendarFieldPartialEnterprise,
} from "~/tests/fixtures/forms/calendarField/data"
import { mockContext } from "~/tests/mockContext"
import { exportCalendarFieldPartialToEnterprise } from "./exportToEnterprise"

describe("exportCalendarFieldToEnterprise", () => {
  describe("exportCalendarFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportCalendarFieldPartialToEnterprise(mockContext, fullCalendarField)

      expect(result).toEqual(fullCalendarFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportCalendarFieldPartialToEnterprise(mockContext, minimalCalendarField)

      expect(result).toEqual(minimalCalendarFieldPartialEnterprise)
    })
  })
})
