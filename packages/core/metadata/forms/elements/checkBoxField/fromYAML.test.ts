import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
import {
  fullCheckBoxField,
  fullCheckBoxFieldPartialEnterprise,
  fullCheckBoxFieldTypedEnterprise,
  minimalCheckBoxField,
  minimalCheckBoxFieldTypedEnterprise,
} from "~/tests/fixtures/forms/checkBoxField/data"
import { mockContext } from "~/tests/mockContext"
import { CheckBoxField } from "./types"

describe("importCheckBoxFieldFromEnterprise", () => {
  describe("importCheckBoxFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromYAMLTyped({
        context: mockContext,
        data: undefined,
        name: "Флажок",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<CheckBoxField>({
        context: mockContext,
        data: fullCheckBoxFieldTypedEnterprise,
        name: "Флажок",
      })

      expect(result).toEqual(fullCheckBoxField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<CheckBoxField>({
        context: mockContext,
        data: minimalCheckBoxFieldTypedEnterprise,
        name: "Флажок",
      })

      expect(result).toEqual(minimalCheckBoxField)
    })
  })

  describe("importCheckBoxFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: FormElementType.CheckBoxField,
        data: fullCheckBoxFieldPartialEnterprise,
        source: fullCheckBoxField,
      })

      expect(result).toEqual(fullCheckBoxField)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: FormElementType.CheckBoxField,
        data: fullCheckBoxFieldPartialEnterprise,
        source: fullCheckBoxField,
      })

      expect(result).toEqual(minimalCheckBoxField)
    })
  })
})
