import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
import {
  fullPeriodField,
  fullPeriodFieldPartialEnterprise,
  fullPeriodFieldTypedEnterprise,
  minimalPeriodField,
  minimalPeriodFieldPartialEnterprise,
  minimalPeriodFieldTypedEnterprise,
} from "~/tests/fixtures/forms/periodField/data"
import { mockContext } from "~/tests/mockContext"
import { PeriodField } from "./types"

describe("importPeriodFieldFromEnterprise", () => {
  describe("importPeriodFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromYAMLTyped<PeriodField>({
        context: mockContext,
        data: undefined,
        name: "ПолеПериода",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<PeriodField>({
        context: mockContext,
        data: fullPeriodFieldTypedEnterprise,
        name: "ПолеПериода",
      })

      expect(result).toEqual(fullPeriodField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<PeriodField>({
        context: mockContext,
        data: minimalPeriodFieldTypedEnterprise,
        name: "ПолеПериода",
      })

      expect(result).toEqual(minimalPeriodField)
    })
  })

  describe("importPeriodFieldPartialFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.PeriodField,
        data: undefined,
        source: undefined,
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.PeriodField,
        data: fullPeriodFieldPartialEnterprise,
        source: fullPeriodField,
      })

      expect(result).toEqual(fullPeriodField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.PeriodField,
        data: minimalPeriodFieldPartialEnterprise,
        source: minimalPeriodField,
      })

      expect(result).toEqual(minimalPeriodField)
    })
  })
})
