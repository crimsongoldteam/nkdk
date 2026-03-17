import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML, importElementFromTypedYAML } from "~/metadata/orchestration"
import {
  fullCheckBoxField,
  fullCheckBoxFieldPartialYAML,
  fullTableCheckBoxField,
  fullTableCheckBoxFieldTypedYAML,
  minimalCheckBoxField,
  minimalCheckBoxFieldPartialYAML,
  minimalTableCheckBoxField,
  minimalTableCheckBoxFieldTypedYAML,
} from "~/tests/fixtures/forms/checkBoxField/data"
import { mockContext } from "~/tests/mockContext"
import { TableCheckBoxField } from "./types"

describe("importCheckBoxFieldFromYAML", () => {
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

  describe("importTableCheckBoxFieldTypedFromYAML", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromTypedYAML<TableCheckBoxField>({
        context: mockContext,
        yaml: fullTableCheckBoxFieldTypedYAML,
        name: "Флажок",
      })

      expect(result).toEqual(fullTableCheckBoxField)
    })

    it("should import minimal", () => {
      const result = importElementFromTypedYAML<TableCheckBoxField>({
        context: mockContext,
        yaml: minimalTableCheckBoxFieldTypedYAML,
        name: "Флажок",
      })

      expect(result).toEqual(minimalTableCheckBoxField)
    })
  })
})
