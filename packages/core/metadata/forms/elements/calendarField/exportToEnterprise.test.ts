import { describe, expect, it } from "vitest"
import {
  fullCalendarField,
  fullCalendarFieldPartialEnterprise,
  fullCalendarFieldTypedEnterprise,
  minimalCalendarField,
  minimalCalendarFieldPartialEnterprise,
} from "~/tests/fixtures/forms/calendarField/data"
import { mockContext } from "~/tests/mockContext"
import { exportCalendarFieldPartialToEnterprise, exportCalendarFieldTypedToEnterprise } from "./exportToEnterprise"

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

  describe("exportCalendarFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportCalendarFieldTypedToEnterprise(mockContext, fullCalendarField)

      expect(result).toEqual(fullCalendarFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportCalendarFieldTypedToEnterprise(mockContext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
