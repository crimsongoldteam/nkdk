import { describe, expect, it } from "vitest"
import {
  CollectionFormElementType,
  importElementFromPartialYAML,
  importElementFromTypedYAML,
} from "~/metadata/metadataFactory"
import {
  fullButtonGroup,
  fullButtonGroupPartialYAML,
  fullButtonGroupTypedYAML,
  minimalButtonGroup,
  minimalButtonGroupPartialYAML,
  minimalButtonGroupTypedYAML,
} from "~/tests/fixtures/forms/buttonGroup/data"
import { mockContext } from "~/tests/mockContext"
import { ButtonGroup } from "./types"

describe("importButtonGroupFromYAML", () => {
  describe("importButtonGroupTypedFromYAML", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromTypedYAML<ButtonGroup>({
        context: mockContext,
        yaml: fullButtonGroupTypedYAML,
        name: "ГруппаКнопок",
      })

      expect(result).toEqual(fullButtonGroup)
    })

    it("should import minimal", () => {
      const result = importElementFromTypedYAML<ButtonGroup>({
        context: mockContext,
        yaml: minimalButtonGroupTypedYAML,
        name: "ГруппаКнопок",
      })

      expect(result).toEqual(minimalButtonGroup)
    })
  })

  describe("importButtonGroupPartialFromYAML", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: CollectionFormElementType.ButtonGroup,
        yaml: fullButtonGroupPartialYAML,
        source: fullButtonGroup,
      })

      expect(result).toEqual(fullButtonGroup)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: CollectionFormElementType.ButtonGroup,
        yaml: minimalButtonGroupPartialYAML,
        source: minimalButtonGroup,
      })

      expect(result).toEqual(minimalButtonGroup)
    })
  })
})
