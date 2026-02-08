import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
import {
  fullCalendarField,
  fullCalendarFieldPartialEnterprise,
  fullCalendarFieldTypedEnterprise,
  minimalCalendarField,
  minimalCalendarFieldPartialEnterprise,
  minimalCalendarFieldTypedEnterprise,
} from "~/tests/fixtures/forms/calendarField/data"
import { mockContext } from "~/tests/mockContext"
import { CalendarField } from "./types"

describe("importCalendarFieldFromEnterprise", () => {
  describe("importCalendarFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromYAMLTyped<CalendarField>({
        context: mockContext,
        data: undefined,
        name: "ПолеКалендаря",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<CalendarField>({
        context: mockContext,
        data: fullCalendarFieldTypedEnterprise,
        name: "ПолеКалендаря",
      })

      expect(result).toEqual(fullCalendarField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<CalendarField>({
        context: mockContext,
        data: minimalCalendarFieldTypedEnterprise,
        name: "ПолеКалендаря",
      })

      expect(result).toEqual(minimalCalendarField)
    })
  })

  describe("importCalendarFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.CalendarField,
        data: fullCalendarFieldPartialEnterprise,
        source: fullCalendarField,
      })

      expect(result).toEqual(fullCalendarField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.CalendarField,
        data: minimalCalendarFieldPartialEnterprise,
        source: minimalCalendarField,
      })

      expect(result).toEqual(minimalCalendarField)
    })
  })
})
