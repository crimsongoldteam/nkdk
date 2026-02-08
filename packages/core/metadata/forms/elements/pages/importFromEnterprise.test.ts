import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
import {
  fullPages,
  fullPagesPartialEnterprise,
  fullPagesTypedEnterprise,
  minimalPages,
  minimalPagesTypedEnterprise,
} from "~/tests/fixtures/forms/pages/data"
import { mockContext } from "~/tests/mockContext"
import { Pages } from "./types"

describe("importPagesFromEnterprise", () => {
  describe("importPagesTypedFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importElementFromYAMLTyped<Pages>({
        context: mockContext,
        data: undefined,
        name: "Страницы",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<Pages>({
        context: mockContext,
        data: fullPagesTypedEnterprise,
        name: "Страницы",
      })

      expect(result).toEqual(fullPages)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<Pages>({
        context: mockContext,
        data: minimalPagesTypedEnterprise,
        name: "Страницы",
      })

      expect(result).toEqual(minimalPages)
    })
  })

  describe("importPagesPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.Pages,
        data: fullPagesPartialEnterprise,
        source: fullPages,
      })

      expect(result).toEqual(fullPages)
    })
  })
})
