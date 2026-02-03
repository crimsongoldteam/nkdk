import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/importFromEnterprise"
import { fullContextMenu, fullContextMenuEnterprise } from "~/tests/fixtures/forms/contextMenu/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importContextMenuFromEnterprise } from "./importFromEnterprise"

describe("importContextMenuFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importContextMenuFromEnterprise(mockContext, mockRule, fullContextMenuEnterprise)

    expect(result).toEqual(fullContextMenu)
  })

  it("should import minimal", () => {
    const result = importContextMenuFromEnterprise(mockContext, mockRule, {})

    expect(result).toEqual({ childItems: [] })
  })
})
