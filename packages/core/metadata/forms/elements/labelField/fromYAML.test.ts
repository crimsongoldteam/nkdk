import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML, importElementFromTypedYAML } from "~/metadata/orchestration"
import {
  fullLabelField,
  fullLabelFieldPartialYAML,
  fullLabelFieldTypedYAML,
  minimalLabelField,
  minimalLabelFieldPartialYAML,
  minimalLabelFieldTypedYAML,
} from "~/tests/fixtures/forms/labelField/data"
import { mockContext } from "~/tests/mockContext"
import { LabelField } from "./types"

describe("importLabelFieldFromYAML", () => {
  describe("importLabelFieldTypedFromYAML", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromTypedYAML<LabelField>({
        context: mockContext,
        yaml: fullLabelFieldTypedYAML,
        name: "ПолеНадписи",
      })

      expect(result).toEqual(fullLabelField)
    })

    it("should import minimal", () => {
      const result = importElementFromTypedYAML<LabelField>({
        context: mockContext,
        yaml: minimalLabelFieldTypedYAML,
        name: "ПолеНадписи",
      })

      expect(result).toEqual(minimalLabelField)
    })
  })

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
})
