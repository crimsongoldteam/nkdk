import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML, importElementFromTypedYAML } from "~/metadata/orchestration"
import {
  fullCheckBoxField,
  fullCheckBoxFieldPartialYAML,
  fullCheckBoxFieldTypedYAML,
  minimalCheckBoxField,
  minimalCheckBoxFieldPartialYAML,
  minimalCheckBoxFieldTypedYAML,
} from "~/tests/fixtures/forms/checkBoxField/data"
import { mockContext } from "~/tests/mockContext"
import { CheckBoxField } from "./types"

describe("importCheckBoxFieldFromYAML", () => {
  describe("importCheckBoxFieldTypedFromYAML", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromTypedYAML<CheckBoxField>({
        context: mockContext,
        yaml: fullCheckBoxFieldTypedYAML,
        name: "Флажок",
      })

      expect(result).toEqual(fullCheckBoxField)
    })

    it("should import minimal", () => {
      const result = importElementFromTypedYAML<CheckBoxField>({
        context: mockContext,
        yaml: minimalCheckBoxFieldTypedYAML,
        name: "Флажок",
      })

      expect(result).toEqual(minimalCheckBoxField)
    })
  })

  describe("importCheckBoxFieldPartialFromYAML", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: "CheckBoxField",
        yaml: fullCheckBoxFieldPartialYAML,
        source: fullCheckBoxField,
      })

      expect(result).toEqual(fullCheckBoxField)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: "CheckBoxField",
        yaml: minimalCheckBoxFieldPartialYAML,
        source: minimalCheckBoxField,
      })

      expect(result).toEqual(minimalCheckBoxField)
    })
  })
})
