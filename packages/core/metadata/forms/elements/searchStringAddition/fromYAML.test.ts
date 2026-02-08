import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
import {
  fullSearchStringAddition,
  fullSearchStringAdditionPartialEnterprise,
  fullSearchStringAdditionTypedEnterprise,
  minimalSearchStringAddition,
  minimalSearchStringAdditionPartialEnterprise,
  minimalSearchStringAdditionTypedEnterprise,
} from "~/tests/fixtures/forms/searchStringAddition/data"
import { mockContext } from "~/tests/mockContext"
import { SearchStringAddition } from "./types"

describe("importSearchStringAdditionFromEnterprise", () => {
  describe("importSearchStringAdditionTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromYAMLTyped<SearchStringAddition>({
        context: mockContext,
        data: undefined,
        name: "СтрокаПоиска",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<SearchStringAddition>({
        context: mockContext,
        data: fullSearchStringAdditionTypedEnterprise,
        name: "СтрокаПоиска",
      })

      expect(result).toEqual(fullSearchStringAddition)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<SearchStringAddition>({
        context: mockContext,
        data: minimalSearchStringAdditionTypedEnterprise,
        name: "СтрокаПоиска",
      })

      expect(result).toEqual(minimalSearchStringAddition)
    })
  })

  describe("importSearchStringAdditionPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: FormElementType.SearchStringAddition,
        data: fullSearchStringAdditionPartialEnterprise,
        source: fullSearchStringAddition,
      })

      expect(result).toEqual(fullSearchStringAddition)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: FormElementType.SearchStringAddition,
        data: minimalSearchStringAdditionPartialEnterprise,
        source: minimalSearchStringAddition,
      })

      expect(result).toEqual(minimalSearchStringAddition)
    })
  })
})
