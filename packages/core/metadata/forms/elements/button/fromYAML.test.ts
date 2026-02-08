import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML, importElementFromTypedYAML } from "~/metadata/metadataFactory"
import {
  fullButton,
  fullButtonPartialEnterprise,
  fullButtonTypedEnterprise,
  minimalButton,
  minimalButtonTypedEnterprise,
} from "~/tests/fixtures/forms/button/data"
import { mockContext } from "~/tests/mockContext"
import { Button } from "./types"

describe("importButtonFromEnterprise", () => {
  describe("importButtonTypedFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromTypedYAML<Button>({
        context: mockContext,
        data: fullButtonTypedEnterprise,
        name: "ОбычнаяКнопка",
      })

      expect(result).toEqual(fullButton)
    })

    it("should import minimal", () => {
      const result = importElementFromTypedYAML<Button>({
        context: mockContext,
        data: minimalButtonTypedEnterprise,
        name: "ОбычнаяКнопка",
      })

      expect(result).toEqual(minimalButton)
    })
  })

  describe("importButtonPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: FormElementType.Button,
        yaml: fullButtonPartialEnterprise,
        source: fullButton,
      })

      expect(result).toEqual(fullButton)
    })
  })
})
