import { describe, expect, it } from "vitest"
import { importPropertyFromEnterprise, PropertyRule } from "~/metadata/metadataFactory"
import {
  fullContextMenu,
  fullContextMenuEnterprise,
  minimalContextMenu,
  minimalContextMenuEnterprise,
} from "~/tests/fixtures/forms/contextMenu/data"
import { mockContext } from "~/tests/mockContext"

const rule: PropertyRule<any> = { type: "ContextMenu" }

describe("importContextMenuFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importPropertyFromEnterprise({
      context: mockContext,
      rule: rule,
      value: fullContextMenuEnterprise,
      sourceValue: fullContextMenu,
    })

    expect(result).toEqual(fullContextMenu)
  })

  it("should import minimal", () => {
    const result = importPropertyFromEnterprise({
      context: mockContext,
      rule: rule,
      value: minimalContextMenuEnterprise,
      sourceValue: minimalContextMenu,
    })

    expect(result).toEqual(minimalContextMenu)
  })
})
