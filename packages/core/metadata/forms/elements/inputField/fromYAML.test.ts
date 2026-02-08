import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
import {
  fullInputField,
  fullInputFieldPartialEnterprise,
  fullInputFieldTypedEnterprise,
  minimalInputField,
  minimalInputFieldPartialEnterprise,
  minimalInputFieldTypedEnterprise,
} from "~/tests/fixtures/forms/inputField/data"
import { mockContext } from "~/tests/mockContext"
import { InputField } from "./types"

describe("importInputFieldFromEnterprise", () => {
  describe("importInputFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromYAMLTyped<InputField>({
        context: mockContext,
        data: undefined,
        name: "ПолеВвода",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<InputField>({
        context: mockContext,
        data: fullInputFieldTypedEnterprise,
        name: "ПолеВвода",
      })

      expect(result).toEqual(fullInputField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<InputField>({
        context: mockContext,
        data: minimalInputFieldTypedEnterprise,
        name: "ПолеВвода",
      })

      expect(result).toEqual(minimalInputField)
    })
  })

  describe("importInputFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: FormElementType.InputField,
        data: fullInputFieldPartialEnterprise,
        source: fullInputField,
      })

      expect(result).toEqual(fullInputField)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: FormElementType.InputField,
        data: minimalInputFieldPartialEnterprise,
        source: minimalInputField,
      })

      expect(result).toEqual(minimalInputField)
    })
  })
})
