import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML, importElementFromTypedYAML } from "~/metadata/orchestration"
import {
  fullInputField,
  fullInputFieldPartialYAML,
  fullInputFieldTypedYAML,
  minimalInputField,
  minimalInputFieldPartialYAML,
  minimalInputFieldTypedYAML,
} from "~/tests/fixtures/forms/inputField/data"
import { mockContext } from "~/tests/mockContext"
import { InputField } from "./types"

describe("importInputFieldFromYAML", () => {
  describe("importInputFieldTypedFromYAML", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromTypedYAML<InputField>({
        context: mockContext,
        yaml: fullInputFieldTypedYAML,
        name: "ПолеВвода",
      })

      expect(result).toEqual(fullInputField)
    })

    it("should import minimal", () => {
      const result = importElementFromTypedYAML<InputField>({
        context: mockContext,
        yaml: minimalInputFieldTypedYAML,
        name: "ПолеВвода",
      })

      expect(result).toEqual(minimalInputField)
    })
  })

  describe("importInputFieldPartialFromYAML", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: "InputField",
        yaml: fullInputFieldPartialYAML,
        source: fullInputField,
      })

      expect(result).toEqual(fullInputField)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: "InputField",
        yaml: minimalInputFieldPartialYAML,
        source: minimalInputField,
      })

      expect(result).toEqual(minimalInputField)
    })
  })
})
