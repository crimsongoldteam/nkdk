import { describe, expect, it } from "vitest"
import { FormElementType } from "~/metadata/metadataFactory/types"
import {
  fullButton,
  fullButtonPartialEnterprise,
  fullButtonSource,
  fullButtonTypedEnterprise,
  minimalButton,
  minimalButtonTypedEnterprise,
} from "~/tests/fixtures/forms/button/data"
import { mockСontext } from "~/tests/mockContext"
import { importButtonChildFromEnterprise, importButtonFromEnterprise } from "./importFromEnterprise"

describe("importButtonFromEnterprise", () => {
  describe("importButtonFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importButtonFromEnterprise(mockСontext, undefined, undefined)

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importButtonFromEnterprise(mockСontext, fullButtonSource, fullButtonPartialEnterprise)

      expect(result).toEqual(fullButton)
    })

    it("should import minimal", () => {
      const result = importButtonFromEnterprise(
        mockСontext,
        { elementType: FormElementType.Button, name: "Кнопка" },
        minimalButtonTypedEnterprise
      )

      expect(result).toEqual(minimalButton)
    })
  })

  describe("importButtonChildFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importButtonChildFromEnterprise(mockСontext, fullButtonTypedEnterprise, "Кнопка")

      expect(result).toEqual(fullButton)
    })
  })
})
