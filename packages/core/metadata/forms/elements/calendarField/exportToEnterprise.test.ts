import { describe, expect, it } from "vitest"
import "~/metadata/commonObjects/exportToEnterprise"
import "~/metadata/forms/elements/calendarField/rules"
import "~/metadata/forms/elements/exportToEnterprise"
import "~/metadata/systemEnumerations/exportToEnterprise"
import {
  fullCalendarField,
  fullCalendarFieldPartialEnterprise,
  minimalCalendarField,
  minimalCalendarFieldPartialEnterprise,
} from "~/tests/fixtures/forms/calendarField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportCalendarFieldPartialToEnterprise } from "./exportToEnterprise"

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
})
