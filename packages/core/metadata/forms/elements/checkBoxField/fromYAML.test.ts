import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML, importElementFromTypedYAML } from "~/metadata/metadataFactory"
import {
  fullCheckBoxField,
  fullCheckBoxFieldPartialEnterprise,
  fullCheckBoxFieldTypedEnterprise,
  minimalCheckBoxField,
  minimalCheckBoxFieldPartialEnterprise,
  minimalCheckBoxFieldTypedEnterprise,
} from "~/tests/fixtures/forms/checkBoxField/data"
import { mockContext } from "~/tests/mockContext"
import { CheckBoxField } from "./types"

describe("importCheckBoxFieldFromEnterprise", () => {
  describe("importCheckBoxFieldTypedFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromTypedYAML<CheckBoxField>({
        context: mockContext,
        yaml: fullCheckBoxFieldTypedEnterprise,
        name: "Флажок",
      })

      expect(result).toEqual(fullCheckBoxField)
    })

    it("should import minimal", () => {
      const result = importElementFromTypedYAML<CheckBoxField>({
        context: mockContext,
        yaml: minimalCheckBoxFieldTypedEnterprise,
        name: "Флажок",
      })

      expect(result).toEqual(minimalCheckBoxField)
    })
  })

  describe("importCheckBoxFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: FormElementType.CheckBoxField,
        yaml: fullCheckBoxFieldPartialEnterprise,
        source: fullCheckBoxField,
      })

      expect(result).toEqual(fullCheckBoxField)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: FormElementType.CheckBoxField,
        yaml: minimalCheckBoxFieldPartialEnterprise,
        source: minimalCheckBoxField,
      })

      expect(result).toEqual(minimalCheckBoxField)
    })
  })
})
