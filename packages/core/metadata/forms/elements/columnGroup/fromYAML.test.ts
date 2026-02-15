import { describe, expect, it } from "vitest"
import {
  CollectionFormElementType,
  importElementFromPartialYAML,
  importElementFromTypedYAML,
} from "~/metadata/metadataFactory"
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
    it("should import all fields from Enterprise", () => {
      const result = importElementFromTypedYAML<ColumnGroup>({
        context: mockContext,
        yaml: fullColumnGroupTypedEnterprise,
        name: "ГруппаКолонок",
      })

      expect(result).toEqual(fullColumnGroup)
    })

    it("should import minimal", () => {
      const result = importElementFromTypedYAML<ColumnGroup>({
        context: mockContext,
        yaml: minimalColumnGroupTypedEnterprise,
        name: "ГруппаКолонок",
      })

      expect(result).toEqual(minimalColumnGroup)
    })
  })

  describe("importColumnGroupPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: CollectionFormElementType.ColumnGroup,
        yaml: fullColumnGroupPartialEnterprise,
        source: fullColumnGroup,
      })

      expect(result).toEqual(fullColumnGroup)
    })
  })
})
