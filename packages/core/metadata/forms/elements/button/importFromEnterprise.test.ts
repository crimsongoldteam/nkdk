import { describe, expect, it } from "vitest"
import { FormElementType } from "~/metadata/metadataFactory/types"
import {
  fullButton,
  fullButtonEnterprise,
  fullButtonPropsEnterprise,
  minimalButton,
  minimalButtonPropsEnterprise,
} from "~/tests/fixtures/forms/button/data"
import { mockСontext } from "~/tests/mockContext"
import { importButtonChildFromEnterprise, importButtonFromSourceEnterprise } from "./importFromEnterprise"

describe("importButtonFromEnterprise", () => {
  describe("importButtonFromSourceEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importButtonFromSourceEnterprise(mockСontext, undefined, undefined)

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importButtonFromSourceEnterprise(
        mockСontext,
        { elementType: FormElementType.Button, name: "Кнопка" },
        fullButtonPropsEnterprise
      )

      expect(result).toEqual(fullButton)
    })

    it("should import minimal", () => {
      const result = importButtonFromSourceEnterprise(
        mockСontext,
        { elementType: FormElementType.Button, name: "Кнопка" },
        minimalButtonPropsEnterprise
      )

      expect(result).toEqual(minimalButton)
    })
  })

  describe("importButtonChildFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importButtonChildFromEnterprise(mockСontext, fullButtonEnterprise)

      expect(result).toEqual(fullButton)
    })
  })
})
