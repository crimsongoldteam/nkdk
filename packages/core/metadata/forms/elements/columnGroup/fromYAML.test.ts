import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML, importElementFromTypedYAML } from "~/metadata/metadataFactory"
import {
  fullColumnGroup,
  fullColumnGroupPartialEnterprise,
  fullColumnGroupTypedEnterprise,
  minimalColumnGroup,
  minimalColumnGroupTypedEnterprise,
} from "~/tests/fixtures/forms/columnGroup/data"
import { mockContext } from "~/tests/mockContext"
import { ColumnGroup } from "./types"

describe("importColumnGroupFromEnterprise", () => {
  describe("importColumnGroupTypedFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importElementFromTypedYAML<ColumnGroup>({
        context: mockContext,
        data: undefined,
        name: "ГруппаКолонок",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromTypedYAML<ColumnGroup>({
        context: mockContext,
        data: fullColumnGroupTypedEnterprise,
        name: "ГруппаКолонок",
      })

      expect(result).toEqual(fullColumnGroup)
    })

    it("should import minimal", () => {
      const result = importElementFromTypedYAML<ColumnGroup>({
        context: mockContext,
        data: minimalColumnGroupTypedEnterprise,
        name: "ГруппаКолонок",
      })

      expect(result).toEqual(minimalColumnGroup)
    })
  })

  describe("importColumnGroupPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: FormElementType.ColumnGroup,
        data: fullColumnGroupPartialEnterprise,
        source: fullColumnGroup,
      })

      expect(result).toEqual(fullColumnGroup)
    })
  })
})
