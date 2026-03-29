import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML, importElementFromTypedYAML } from "~/metadata/orchestration"
import {
  fullLabelField,
  fullLabelFieldPartialYAML,
  fullTableLabelField,
  fullTableLabelFieldTypedYAML,
  minimalLabelField,
  minimalLabelFieldPartialYAML,
  minimalTableLabelField,
  minimalTableLabelFieldTypedYAML,
} from "~/metadata/forms/elements/labelField/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"
import { TableLabelField } from "./types"

describe("importLabelFieldFromYAML", () => {
  describe("importLabelFieldPartialFromYAML", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: "LabelField",
        yaml: fullLabelFieldPartialYAML,
        source: fullLabelField,
      })

      expect(result).toEqual(fullLabelField)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: "LabelField",
        yaml: minimalLabelFieldPartialYAML,
        source: minimalLabelField,
      })

      expect(result).toEqual(minimalLabelField)
    })
  })

  describe("importTableLabelFieldTypedFromYAML", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromTypedYAML<TableLabelField>({
        context: mockContext,
        yaml: fullTableLabelFieldTypedYAML,
        name: "ПолеНадписи",
      })

      expect(result).toEqual(fullTableLabelField)
    })

    it("should import minimal", () => {
      const result = importElementFromTypedYAML<TableLabelField>({
        context: mockContext,
        yaml: minimalTableLabelFieldTypedYAML,
        name: "ПолеНадписи",
      })

      expect(result).toEqual(minimalTableLabelField)
    })
  })
})
