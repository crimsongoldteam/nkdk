import { describe, expect, it } from "vitest"
import {
  fullInputField,
  fullInputFieldPartialYAML,
  fullTableInputField,
  fullTableInputFieldTypedYAML,
  minimalInputField,
  minimalInputFieldPartialYAML,
  minimalTableInputField,
  minimalTableInputFieldTypedYAML,
} from "~/metadata/forms/elements/inputField/__fixtures__/data"
import { importElementFromPartialYAML, importElementFromTypedYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { TableInputField } from "./types"

describe("importInputFieldFromYAML", () => {
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

  describe("importTableInputFieldTypedFromYAML", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromTypedYAML<TableInputField>({
        context: mockContext,
        yaml: fullTableInputFieldTypedYAML,
        name: "ПолеВвода",
      })

      expect(result).toEqual(fullTableInputField)
    })

    it("should import minimal", () => {
      const result = importElementFromTypedYAML<TableInputField>({
        context: mockContext,
        yaml: minimalTableInputFieldTypedYAML,
        name: "ПолеВвода",
      })

      expect(result).toEqual(minimalTableInputField)
    })
  })
})
