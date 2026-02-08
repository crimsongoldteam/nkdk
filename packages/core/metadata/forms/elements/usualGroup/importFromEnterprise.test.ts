import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
import {
  fullUsualGroup,
  fullUsualGroupPartialEnterprise,
  fullUsualGroupTypedEnterprise,
  minimalUsualGroup,
  minimalUsualGroupPartialEnterprise,
  minimalUsualGroupTypedEnterprise,
} from "~/tests/fixtures/forms/usualGroup/data"
import { mockContext } from "~/tests/mockContext"
import { UsualGroup } from "./types"

describe("importUsualGroupFromEnterprise", () => {
  describe("importUsualGroupTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromYAMLTyped<UsualGroup>({
        context: mockContext,
        data: undefined,
        name: "ОбычнаяГруппа",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<UsualGroup>({
        context: mockContext,
        data: fullUsualGroupTypedEnterprise,
        name: "ОбычнаяГруппа",
      })

      expect(result).toEqual(fullUsualGroup)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<UsualGroup>({
        context: mockContext,
        data: minimalUsualGroupTypedEnterprise,
        name: "ОбычнаяГруппа",
      })

      expect(result).toEqual(minimalUsualGroup)
    })
  })

  describe("importUsualGroupPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.UsualGroup,
        data: fullUsualGroupPartialEnterprise,
        source: fullUsualGroup,
      })

      expect(result).toEqual(fullUsualGroup)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.UsualGroup,
        data: minimalUsualGroupPartialEnterprise,
        source: minimalUsualGroup,
      })

      expect(result).toEqual(minimalUsualGroup)
    })
  })
})
