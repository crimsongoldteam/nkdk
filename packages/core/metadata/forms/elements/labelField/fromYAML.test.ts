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
    it("should return undefined when data is undefined", () => {
      const result = importElementFromTypedYAML<LabelField>({
        context: mockContext,
        data: undefined,
        name: "ПолеНадписи",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromTypedYAML<LabelField>({
        context: mockContext,
        data: fullLabelFieldTypedEnterprise,
        name: "ПолеНадписи",
      })

      expect(result).toEqual(fullLabelField)
    })

    it("should import minimal", () => {
      const result = importElementFromTypedYAML<LabelField>({
        context: mockContext,
        data: minimalLabelFieldTypedEnterprise,
        name: "ПолеНадписи",
      })

      expect(result).toEqual(minimalLabelField)
    })
  })

  describe("importLabelFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: FormElementType.LabelField,
        data: fullLabelFieldPartialEnterprise,
        source: fullLabelField,
      })

      expect(result).toEqual(fullLabelField)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: FormElementType.LabelField,
        data: minimalLabelFieldPartialEnterprise,
        source: minimalLabelField,
      })

      expect(result).toEqual(minimalLabelField)
    })
  })
})
