import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
import {
  fullViewStatusAddition,
  fullViewStatusAdditionPartialEnterprise,
  fullViewStatusAdditionTypedEnterprise,
  minimalViewStatusAddition,
  minimalViewStatusAdditionPartialEnterprise,
  minimalViewStatusAdditionTypedEnterprise,
} from "~/tests/fixtures/forms/viewStatusAddition/data"
import { mockContext } from "~/tests/mockContext"
import { ViewStatusAddition } from "./types"

describe("importViewStatusAdditionFromEnterprise", () => {
  describe("importViewStatusAdditionTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromYAMLTyped<ViewStatusAddition>({
        context: mockContext,
        data: undefined,
        name: "СтатусПросмотра",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<ViewStatusAddition>({
        context: mockContext,
        data: fullViewStatusAdditionTypedEnterprise,
        name: "СтатусПросмотра",
      })

      expect(result).toEqual(fullViewStatusAddition)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<ViewStatusAddition>({
        context: mockContext,
        data: minimalViewStatusAdditionTypedEnterprise,
        name: "СтатусПросмотра",
      })

      expect(result).toEqual(minimalViewStatusAddition)
    })
  })

  describe("importViewStatusAdditionPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.ViewStatusAddition,
        data: fullViewStatusAdditionPartialEnterprise,
        source: fullViewStatusAddition,
      })

      expect(result).toEqual(fullViewStatusAddition)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.ViewStatusAddition,
        data: minimalViewStatusAdditionPartialEnterprise,
        source: minimalViewStatusAddition,
      })

      expect(result).toEqual(minimalViewStatusAddition)
    })
  })
})
