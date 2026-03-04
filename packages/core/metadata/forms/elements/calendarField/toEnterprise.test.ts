import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullCalendarField, fullCalendarFieldEnterprise } from "~/tests/fixtures/forms/calendarField/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export CalendarField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      itemType: CollectionFormElementType.CalendarField,
      value: fullCalendarField,
    })
    expect(result).toEqual(fullCalendarFieldEnterprise)
  })
})
