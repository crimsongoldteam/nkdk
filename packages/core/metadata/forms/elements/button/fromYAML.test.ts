import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML, importElementFromTypedYAML } from "~/metadata/orchestration"
import {
  fullButton,
  fullButtonPartialYAML,
  fullButtonTypedYAML,
  minimalButton,
  minimalButtonTypedYAML,
} from "~/tests/fixtures/forms/button/data"
import { mockContext } from "~/tests/mockContext"
import { Button } from "./types"

describe("importButtonFromYAML", () => {
  describe("importButtonTypedFromYAML", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromTypedYAML<Button>({
        context: mockContext,
        yaml: fullButtonTypedYAML,
        name: "ОбычнаяКнопка",
      })

      expect(result).toEqual(fullButton)
    })

    it("should import minimal", () => {
      const result = importElementFromTypedYAML<Button>({
        context: mockContext,
        yaml: minimalButtonTypedYAML,
        name: "ОбычнаяКнопка",
      })

      expect(result).toEqual(minimalButton)
    })
  })

  describe("importButtonPartialFromYAML", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: "Button",
        yaml: fullButtonPartialYAML,
        source: fullButton,
      })

      expect(result).toEqual(fullButton)
    })
  })
})
