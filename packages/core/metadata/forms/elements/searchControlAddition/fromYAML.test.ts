import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML, importElementFromTypedYAML } from "~/metadata/metadataFactory"
import {
  fullSearchControlAddition,
  fullSearchControlAdditionPartialEnterprise,
  fullSearchControlAdditionTypedEnterprise,
  minimalSearchControlAddition,
  minimalSearchControlAdditionPartialEnterprise,
  minimalSearchControlAdditionTypedEnterprise,
} from "~/tests/fixtures/forms/searchControlAddition/data"
import { mockContext } from "~/tests/mockContext"
import { SearchControlAddition } from "./types"

describe("importSearchControlAdditionFromEnterprise", () => {
  describe("importSearchControlAdditionTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromTypedYAML<SearchControlAddition>({
        context: mockContext,
        data: undefined,
        name: "Поиск",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromTypedYAML<SearchControlAddition>({
        context: mockContext,
        data: fullSearchControlAdditionTypedEnterprise,
        name: "Поиск",
      })

      expect(result).toEqual(fullSearchControlAddition)
    })

    it("should import minimal", () => {
      const result = importElementFromTypedYAML<SearchControlAddition>({
        context: mockContext,
        data: minimalSearchControlAdditionTypedEnterprise,
        name: "Поиск",
      })

      expect(result).toEqual(minimalSearchControlAddition)
    })
  })

  describe("importSearchControlAdditionPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: FormElementType.SearchControlAddition,
        yaml: fullSearchControlAdditionPartialEnterprise,
        source: fullSearchControlAddition,
      })

      expect(result).toEqual(fullSearchControlAddition)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: FormElementType.SearchControlAddition,
        yaml: minimalSearchControlAdditionPartialEnterprise,
        source: minimalSearchControlAddition,
      })

      expect(result).toEqual(minimalSearchControlAddition)
    })
  })
})
