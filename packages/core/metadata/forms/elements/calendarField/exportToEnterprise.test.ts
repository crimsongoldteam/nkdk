import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"
import {
  fullCalendarField,
  fullCalendarFieldPartialEnterprise,
  minimalCalendarField,
} from "~/tests/fixtures/forms/calendarField/data"
import { mockContext } from "~/tests/mockContext"

describe("exportCalendarFieldToEnterprise", () => {
  describe("exportElementToPartialYAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullCalendarField })

      expect(result).toEqual(fullCalendarFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalCalendarField })

      expect(result).toBeUndefined()
    })
  })
})
