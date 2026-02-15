import { describe, expect, it } from "vitest"
import {
  CollectionFormElementType,
  importElementFromPartialYAML,
  importElementFromTypedYAML,
} from "~/metadata/metadataFactory"
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
    it("should import all fields from Enterprise", () => {
      const result = importElementFromTypedYAML<InputField>({
        context: mockContext,
        yaml: fullInputFieldTypedEnterprise,
        name: "ПолеВвода",
      })

      expect(result).toEqual(fullInputField)
    })

    it("should import minimal", () => {
      const result = importElementFromTypedYAML<InputField>({
        context: mockContext,
        yaml: minimalInputFieldTypedEnterprise,
        name: "ПолеВвода",
      })

      expect(result).toEqual(minimalInputField)
    })
  })

  describe("importInputFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: CollectionFormElementType.InputField,
        yaml: fullInputFieldPartialEnterprise,
        source: fullInputField,
      })

      expect(result).toEqual(fullInputField)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: CollectionFormElementType.InputField,
        yaml: minimalInputFieldPartialEnterprise,
        source: minimalInputField,
      })

      expect(result).toEqual(minimalInputField)
    })
  })
})
