import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/orchestration"
import {
  fullCalendarField,
  fullCalendarFieldPartialYAML,
  minimalCalendarField,
} from "~/tests/fixtures/forms/calendarField/data"
import { mockContext } from "~/tests/mockContext"

describe("exportCalendarFieldToYAML", () => {
  describe("exportElementToPartialYAML", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullCalendarField })

      expect(result).toEqual(fullCalendarFieldPartialYAML)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalCalendarField })

      expect(result).toBeUndefined()
    })
  })
})
