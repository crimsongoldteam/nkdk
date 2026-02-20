import { describe, expect, it } from "vitest"
import { CollectionFormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
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
      itemType: CollectionFormElementType.CalendarField,
      yaml: fullCalendarFieldPartialYAML,
      source: fullCalendarField,
    })

    expect(result).toEqual(fullCalendarField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.CalendarField,
      yaml: minimalCalendarFieldPartialYAML,
      source: minimalCalendarField,
    })

    expect(result).toEqual(minimalCalendarField)
  })
})
