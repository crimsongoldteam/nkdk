import { describe, expect, it } from "vitest"
import "~/metadata/commonObjects/importFromEnterprise"
import "~/metadata/forms/elements/calendarField/rules"
import "~/metadata/forms/elements/importFromEnterprise"
import {
  fullCalendarField,
  fullCalendarFieldPartialEnterprise,
  minimalCalendarField,
  minimalCalendarFieldPartialEnterprise,
} from "~/tests/fixtures/forms/calendarField/data"
import { mockContext } from "~/tests/mockContext"
import { importCalendarFieldPartialFromEnterprise } from "./importFromEnterprise"

describe("importCalendarFieldFromEnterprise", () => {
  describe("importCalendarFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importCalendarFieldPartialFromEnterprise(
        mockContext,
        fullCalendarField,
        fullCalendarFieldPartialEnterprise
      )

      expect(result).toEqual(fullCalendarField)
    })

    it("should import minimal", () => {
      const result = importCalendarFieldPartialFromEnterprise(
        mockContext,
        minimalCalendarField,
        minimalCalendarFieldPartialEnterprise
      )

      expect(result).toEqual(minimalCalendarField)
    })
  })
})
