import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullCalendarField,
  fullCalendarFieldPartialEnterprise,
  minimalCalendarField,
  minimalCalendarFieldPartialEnterprise,
} from "~/tests/fixtures/forms/calendarField/data"
import { mockContext } from "~/tests/mockContext"

describe("importCalendarFieldFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: FormElementType.CalendarField,
      yaml: fullCalendarFieldPartialEnterprise,
      source: fullCalendarField,
    })

    expect(result).toEqual(fullCalendarField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: FormElementType.CalendarField,
      yaml: minimalCalendarFieldPartialEnterprise,
      source: minimalCalendarField,
    })

    expect(result).toEqual(minimalCalendarField)
  })
})
