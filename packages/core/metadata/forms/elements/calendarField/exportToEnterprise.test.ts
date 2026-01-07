import { describe, expect, it } from "vitest"
import {
  fullCalendarField,
  fullCalendarFieldEnterprise,
  minimalCalendarField,
  minimalCalendarFieldEnterprise,
} from "~/tests/fixtures/forms/calendarField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportCalendarFieldToEnterprise } from "./exportToEnterprise"

describe("exportCalendarFieldToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportCalendarFieldToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportCalendarFieldToEnterprise(mockСontext, fullCalendarField)

    expect(result).toEqual(fullCalendarFieldEnterprise)
  })

  it("should export minimal", () => {
    const result = exportCalendarFieldToEnterprise(mockСontext, minimalCalendarField)

    expect(result).toEqual(minimalCalendarFieldEnterprise)
  })
})

