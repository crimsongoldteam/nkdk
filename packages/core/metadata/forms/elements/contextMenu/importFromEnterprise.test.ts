import { describe, expect, it } from "vitest"
import {
  fullContextMenu,
  fullContextMenuEnterprise,
} from "~/tests/fixtures/forms/contextMenu/data"
import { mockСontext } from "~/tests/mockContext"
import { importContextMenuFromEnterprise } from "./importFromEnterprise"

describe("importContextMenuFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importContextMenuFromEnterprise(mockСontext, fullContextMenuEnterprise)

    expect(result).toBeDefined()
    expect(result?.displayImportance).toBe(fullContextMenu.displayImportance)
    expect(result?.autofill).toBe(fullContextMenu.autofill)
    expect(result?.childItems).toEqual(fullContextMenu.childItems)
  })

  it("should import minimal", () => {
    const result = importContextMenuFromEnterprise(mockСontext, {})

    expect(result).toEqual({ childItems: [] })
  })
})
