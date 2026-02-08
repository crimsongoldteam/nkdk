import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
import {
  fullCommandBar,
  fullCommandBarPartialEnterprise,
  fullCommandBarTypedEnterprise,
  minimalCommandBar,
  minimalCommandBarPartialEnterprise,
  minimalCommandBarTypedEnterprise,
} from "~/tests/fixtures/forms/commandBar/data"
import { mockContext } from "~/tests/mockContext"
import { CommandBar } from "./types"

describe("importCommandBarFromEnterprise", () => {
  describe("importCommandBarTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromYAMLTyped<CommandBar>({
        context: mockContext,
        data: undefined,
        name: "КоманднаяПанель",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<CommandBar>({
        context: mockContext,
        data: fullCommandBarTypedEnterprise,
        name: "КоманднаяПанель",
      })

      expect(result).toEqual(fullCommandBar)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<CommandBar>({
        context: mockContext,
        data: minimalCommandBarTypedEnterprise,
        name: "КоманднаяПанель",
      })

      expect(result).toEqual(minimalCommandBar)
    })
  })

  describe("importCommandBarPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.CommandBar,
        data: fullCommandBarPartialEnterprise,
        source: fullCommandBar,
      })

      expect(result).toEqual(fullCommandBar)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.CommandBar,
        data: minimalCommandBarPartialEnterprise,
        source: minimalCommandBar,
      })

      expect(result).toEqual(minimalCommandBar)
    })
  })
})
