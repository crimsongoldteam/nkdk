import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/button/importFromEnterprise"
import { FormElementType } from "~/metadata/metadataFactory/types"
import {
  fullButtonGroup,
  fullButtonGroupChildEnterprise,
  fullButtonGroupPropsEnterprise,
  fullButtonGroupSource,
  minimalButtonGroup,
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
      const result = importButtonGroupFromEnterprise(mockСontext, fullButtonGroupSource, fullButtonGroupPropsEnterprise)

      expect(result).toEqual(fullButtonGroup)
    })

    it("should import minimal", () => {
      const result = importButtonGroupFromEnterprise(
        mockСontext,
        { elementType: FormElementType.ButtonGroup, name: "ГруппаКнопок", childItems: [] },
        {}
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
