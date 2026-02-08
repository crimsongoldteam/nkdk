import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
import {
  fullButtonGroup,
  fullButtonGroupPartialEnterprise,
  fullButtonGroupTypedEnterprise,
  minimalButtonGroup,
  minimalButtonGroupPartialEnterprise,
  minimalButtonGroupTypedEnterprise,
} from "~/tests/fixtures/forms/buttonGroup/data"
import { mockContext } from "~/tests/mockContext"
import { ButtonGroup } from "./types"

describe("importButtonGroupFromEnterprise", () => {
  describe("importButtonGroupTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromYAMLTyped<ButtonGroup>({
        context: mockContext,
        data: undefined,
        name: "ГруппаКнопок",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<ButtonGroup>({
        context: mockContext,
        data: fullButtonGroupTypedEnterprise,
        name: "ГруппаКнопок",
      })

      expect(result).toEqual(fullButtonGroup)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<ButtonGroup>({
        context: mockContext,
        data: minimalButtonGroupTypedEnterprise,
        name: "ГруппаКнопок",
      })

      expect(result).toEqual(minimalButtonGroup)
    })
  })

  describe("importButtonGroupPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.ButtonGroup,
        data: fullButtonGroupPartialEnterprise,
        source: fullButtonGroup,
      })

      expect(result).toEqual(fullButtonGroup)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.ButtonGroup,
        data: minimalButtonGroupPartialEnterprise,
        source: minimalButtonGroup,
      })

      expect(result).toEqual(minimalButtonGroup)
    })
  })
})
