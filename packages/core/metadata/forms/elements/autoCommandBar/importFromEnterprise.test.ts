import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
import {
  fullAutoCommandBar,
  fullAutoCommandBarPartialEnterprise,
  fullAutoCommandBarTypedEnterprise,
  minimalAutoCommandBar,
  minimalAutoCommandBarPartialEnterprise,
  minimalAutoCommandBarTypedEnterprise,
} from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockContext } from "~/tests/mockContext"
import { AutoCommandBar } from "./types"

describe("importAutoCommandBarFromEnterprise", () => {
  describe("importAutoCommandBarTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromYAMLTyped<AutoCommandBar>({
        context: mockContext,
        data: undefined,
        name: "АвтоКоманднаяПанель",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<AutoCommandBar>({
        context: mockContext,
        data: fullAutoCommandBarTypedEnterprise,
        name: "АвтоКоманднаяПанель",
      })

      expect(result).toEqual(fullAutoCommandBar)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<AutoCommandBar>({
        context: mockContext,
        data: minimalAutoCommandBarTypedEnterprise,
        name: "АвтоКоманднаяПанель",
      })

      expect(result).toEqual(minimalAutoCommandBar)
    })
  })

  describe("importAutoCommandBarPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.AutoCommandBar,
        data: fullAutoCommandBarPartialEnterprise,
        source: fullAutoCommandBar,
      })

      expect(result).toEqual(fullAutoCommandBar)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.AutoCommandBar,
        data: minimalAutoCommandBarPartialEnterprise,
        source: minimalAutoCommandBar,
      })

      expect(result).toEqual(minimalAutoCommandBar)
    })
  })
})
