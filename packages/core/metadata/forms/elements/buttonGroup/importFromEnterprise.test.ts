import { describe, expect, it } from "vitest"
import { FormElementType } from "~/metadata/metadataFactory/types"
import "~/metadata/forms/elements/button/importFromEnterprise"
import {
  fullButtonGroup,
  fullButtonGroupChildEnterprise,
  fullButtonGroupEnterprise,
  fullButtonGroupPropsEnterprise,
  fullButtonGroupSource,
  minimalButtonGroup,
  minimalButtonGroupEnterprise,
} from "~/tests/fixtures/forms/buttonGroup/data"
import { mockСontext } from "~/tests/mockContext"
import { importButtonGroupChildFromEnterprise, importButtonGroupFromEnterprise } from "./importFromEnterprise"

describe("importButtonGroupFromEnterprise", () => {
  describe("importButtonGroupFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importButtonGroupFromEnterprise(mockСontext, undefined, undefined)

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importButtonGroupFromEnterprise(mockСontext, fullButtonGroupSource, fullButtonGroupEnterprise)

      expect(result).toEqual(fullButtonGroup)
    })

    it("should import minimal", () => {
      const result = importButtonGroupFromEnterprise(
        mockСontext,
        { elementType: FormElementType.ButtonGroup, name: "ГруппаКнопок", childItems: [] },
        fullButtonGroupPropsEnterprise
      )

      expect(result).toEqual(minimalButtonGroup)
    })
  })

  describe("importButtonGroupChildFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importButtonGroupChildFromEnterprise(mockСontext, fullButtonGroupChildEnterprise)

      expect(result).toEqual(fullButtonGroup)
    })
  })
})
