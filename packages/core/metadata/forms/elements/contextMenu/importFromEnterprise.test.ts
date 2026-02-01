import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/importFromEnterprise"
import { fullContextMenu, fullContextMenuEnterprise } from "~/tests/fixtures/forms/contextMenu/data"
import { mockContext } from "~/tests/mockContext"
import { importContextMenuFromEnterprise } from "./importFromEnterprise"

describe("importContextMenuFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importContextMenuFromEnterprise(mockContext, fullContextMenuEnterprise)

    expect(result).toEqual(fullContextMenu)
  })

  it("should import minimal", () => {
    const result = importContextMenuFromEnterprise(mockContext, {})

    expect(result).toEqual({ childItems: [] })
  })
})
