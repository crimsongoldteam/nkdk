import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import {
  fullCalendarField,
  fullCalendarFieldEnterprise,
} from "~/tests/fixtures/forms/calendarField/data"
import { mockContext } from "~/tests/mockContext"

describe("export CalendarField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockContext,
      preview: { prefix: "prefix_", attributes: {} },
    }
    const result = exportElementToEnterprise({
      context,
      itemType: CollectionFormElementType.CalendarField,
      value: fullCalendarField,
    })
    expect(result).toEqual(fullCalendarFieldEnterprise)
  })
})
