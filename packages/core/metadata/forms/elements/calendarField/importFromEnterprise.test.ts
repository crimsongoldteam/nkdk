import { describe, expect, it } from "vitest"
import {
  fullCalendarField,
  fullCalendarFieldEnterprise,
  minimalCalendarField,
  minimalCalendarFieldEnterprise,
} from "~/tests/fixtures/forms/calendarField/data"
import { mockСontext } from "~/tests/mockContext"
import { importCalendarFieldFromEnterprise } from "./importFromEnterprise"

describe("importCalendarFieldFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importCalendarFieldFromEnterprise(mockСontext, undefined, fullCalendarField.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importCalendarFieldFromEnterprise(mockСontext, fullCalendarFieldEnterprise, fullCalendarField.name)

    expect(result).toEqual(fullCalendarField)
  })

  it("should import minimal", () => {
    const result = importCalendarFieldFromEnterprise(
      mockСontext,
      minimalCalendarFieldEnterprise,
      minimalCalendarField.name
    )

    expect(result).toEqual(minimalCalendarField)
  })
})
