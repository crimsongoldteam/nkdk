import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToEnterprise"
import { fullContextMenu, fullContextMenuEnterprise, minimalContextMenu } from "~/tests/fixtures/forms/contextMenu/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportContextMenuToEnterprise } from "./exportToEnterprise"

describe("exportContextMenuToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportContextMenuToEnterprise(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportContextMenuToEnterprise(mockContext, mockRule, fullContextMenu)

    expect(result).toEqual(fullContextMenuEnterprise)
  })

  it("should export minimal", () => {
    const result = exportContextMenuToEnterprise(mockContext, mockRule, minimalContextMenu)

    expect(result).toBeUndefined()
  })
})
