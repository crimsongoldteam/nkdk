import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
import {
  fullProgressBarField,
  fullProgressBarFieldPartialEnterprise,
  fullProgressBarFieldTypedEnterprise,
  minimalProgressBarField,
  minimalProgressBarFieldPartialEnterprise,
  minimalProgressBarFieldTypedEnterprise,
} from "~/tests/fixtures/forms/progressBarField/data"
import { mockContext } from "~/tests/mockContext"
import { ProgressBarField } from "./types"

describe("importProgressBarFieldFromEnterprise", () => {
  describe("importProgressBarFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromYAMLTyped<ProgressBarField>({
        context: mockContext,
        data: undefined,
        name: "ПолеИндикатора",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<ProgressBarField>({
        context: mockContext,
        data: fullProgressBarFieldTypedEnterprise,
        name: "ПолеИндикатора",
      })

      expect(result).toEqual(fullProgressBarField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<ProgressBarField>({
        context: mockContext,
        data: minimalProgressBarFieldTypedEnterprise,
        name: "ПолеИндикатора",
      })

      expect(result).toEqual(minimalProgressBarField)
    })
  })

  describe("importProgressBarFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.ProgressBarField,
        data: fullProgressBarFieldPartialEnterprise,
        source: fullProgressBarField,
      })

      expect(result).toEqual(fullProgressBarField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.ProgressBarField,
        data: minimalProgressBarFieldPartialEnterprise,
        source: minimalProgressBarField,
      })

      expect(result).toEqual(minimalProgressBarField)
    })
  })
})
