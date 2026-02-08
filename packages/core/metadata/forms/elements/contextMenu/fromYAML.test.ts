import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullContextMenu,
  fullContextMenuPartialEnterprise,
  minimalContextMenu,
  minimalContextMenuPartialEnterprise,
} from "~/tests/fixtures/forms/contextMenu/data"
import { mockContext } from "~/tests/mockContext"

describe("importContextMenuFromEnterprise", () => {
  describe("importContextMenuPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: FormElementType.ContextMenu,
        data: fullContextMenuPartialEnterprise,
        source: fullContextMenu,
      })

      expect(result).toEqual(fullContextMenu)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: FormElementType.ContextMenu,
        data: minimalContextMenuPartialEnterprise,
        source: minimalContextMenu,
      })

      expect(result).toEqual(minimalContextMenu)
    })
  })
})
