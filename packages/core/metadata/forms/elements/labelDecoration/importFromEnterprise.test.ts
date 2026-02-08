import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
import {
  fullLabelDecoration,
  fullLabelDecorationPartialEnterprise,
  fullLabelDecorationTypedEnterprise,
  minimalLabelDecoration,
  minimalLabelDecorationTypedEnterprise,
} from "~/tests/fixtures/forms/labelDecoration/data"
import { mockContext } from "~/tests/mockContext"
import { LabelDecoration } from "./types"

describe("importLabelDecorationFromEnterprise", () => {
  describe("importLabelDecorationTypedFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importElementFromYAMLTyped<LabelDecoration>({
        context: mockContext,
        data: undefined,
        name: "Надпись",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<LabelDecoration>({
        context: mockContext,
        data: fullLabelDecorationTypedEnterprise,
        name: "Заголовок",
      })

      expect(result).toEqual(fullLabelDecoration)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<LabelDecoration>({
        context: mockContext,
        data: minimalLabelDecorationTypedEnterprise,
        name: "Заголовок",
      })

      expect(result).toEqual(minimalLabelDecoration)
    })
  })

  describe("importLabelDecorationPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.LabelDecoration,
        data: fullLabelDecorationPartialEnterprise,
        source: fullLabelDecoration,
      })

      expect(result).toEqual(fullLabelDecoration)
    })
  })
})
