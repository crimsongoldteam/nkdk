import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML, importElementFromTypedYAML } from "~/metadata/metadataFactory"
import {
  fullLabelField,
  fullLabelFieldPartialEnterprise,
  fullLabelFieldTypedEnterprise,
  minimalLabelField,
  minimalLabelFieldPartialEnterprise,
  minimalLabelFieldTypedEnterprise,
} from "~/tests/fixtures/forms/labelField/data"
import { mockContext } from "~/tests/mockContext"
import { LabelField } from "./types"

describe("importLabelFieldFromEnterprise", () => {
  describe("importLabelFieldTypedFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromTypedYAML<LabelField>({
        context: mockContext,
        yaml: fullLabelFieldTypedEnterprise,
        name: "ПолеНадписи",
      })

      expect(result).toEqual(fullLabelField)
    })

    it("should import minimal", () => {
      const result = importElementFromTypedYAML<LabelField>({
        context: mockContext,
        yaml: minimalLabelFieldTypedEnterprise,
        name: "ПолеНадписи",
      })

      expect(result).toEqual(minimalLabelField)
    })
  })

  describe("importLabelFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: FormElementType.LabelField,
        yaml: fullLabelFieldPartialEnterprise,
        source: fullLabelField,
      })

      expect(result).toEqual(fullLabelField)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: FormElementType.LabelField,
        yaml: minimalLabelFieldPartialEnterprise,
        source: minimalLabelField,
      })

      expect(result).toEqual(minimalLabelField)
    })
  })
})
