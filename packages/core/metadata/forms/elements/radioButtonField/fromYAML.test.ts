import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
import {
  fullRadioButtonField,
  fullRadioButtonFieldPartialEnterprise,
  fullRadioButtonFieldTypedEnterprise,
  minimalRadioButtonField,
  minimalRadioButtonFieldPartialEnterprise,
  minimalRadioButtonFieldTypedEnterprise,
} from "~/tests/fixtures/forms/radioButtonField/data"
import { mockContext } from "~/tests/mockContext"
import { RadioButtonField } from "./types"

describe("importRadioButtonFieldFromEnterprise", () => {
  describe("importRadioButtonFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromYAMLTyped<RadioButtonField>({
        context: mockContext,
        data: undefined,
        name: "ПолеПереключателя",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<RadioButtonField>({
        context: mockContext,
        data: fullRadioButtonFieldTypedEnterprise,
        name: "ПолеПереключателя",
      })

      expect(result).toEqual(fullRadioButtonField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<RadioButtonField>({
        context: mockContext,
        data: minimalRadioButtonFieldTypedEnterprise,
        name: "ПолеПереключателя",
      })

      expect(result).toEqual(minimalRadioButtonField)
    })
  })

  describe("importRadioButtonFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.RadioButtonField,
        data: fullRadioButtonFieldPartialEnterprise,
        source: fullRadioButtonField,
      })

      expect(result).toEqual(fullRadioButtonField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.RadioButtonField,
        data: minimalRadioButtonFieldPartialEnterprise,
        source: minimalRadioButtonField,
      })

      expect(result).toEqual(minimalRadioButtonField)
    })
  })
})
