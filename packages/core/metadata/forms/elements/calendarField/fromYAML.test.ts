import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML } from "~/metadata/orchestration"
import {
  fullCalendarField,
  fullCalendarFieldPartialYAML,
  minimalCalendarField,
  minimalCalendarFieldPartialYAML,
} from "~/tests/fixtures/forms/calendarField/data"
import { mockContext } from "~/tests/mockContext"

describe("importCalendarFieldFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "CalendarField",
      yaml: fullCalendarFieldPartialYAML,
      source: fullCalendarField,
    })

    expect(result).toEqual(fullCalendarField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "CalendarField",
      yaml: minimalCalendarFieldPartialYAML,
      source: minimalCalendarField,
    })

    expect(result).toEqual(minimalCalendarField)
  })
})
