import { describe, expect, it } from "vitest"
import {
  importElementFromPartialYAML,
  importElementFromTypedYAML,
} from "~/metadata/metadataFactory"
import {
  fullColumnGroup,
  fullColumnGroupPartialYAML,
  fullColumnGroupTypedYAML,
  minimalColumnGroup,
  minimalColumnGroupTypedYAML,
} from "~/tests/fixtures/forms/columnGroup/data"
import { mockContext } from "~/tests/mockContext"
import { ColumnGroup } from "./types"

describe("importColumnGroupFromYAML", () => {
  describe("importColumnGroupTypedFromYAML", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromTypedYAML<ColumnGroup>({
        context: mockContext,
        yaml: fullColumnGroupTypedYAML,
        name: "ГруппаКолонок",
      })

      expect(result).toEqual(fullColumnGroup)
    })

    it("should import minimal", () => {
      const result = importElementFromTypedYAML<ColumnGroup>({
        context: mockContext,
        yaml: minimalColumnGroupTypedYAML,
        name: "ГруппаКолонок",
      })

      expect(result).toEqual(minimalColumnGroup)
    })
  })

  describe("importColumnGroupPartialFromYAML", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: "ColumnGroup",
        yaml: fullColumnGroupPartialYAML,
        source: fullColumnGroup,
      })

      expect(result).toEqual(fullColumnGroup)
    })
  })
})
