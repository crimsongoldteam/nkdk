import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToEnterprise"
import { fullContextMenu, fullContextMenuEnterprise, minimalContextMenu } from "~/tests/fixtures/forms/contextMenu/data"
import { mockContext } from "~/tests/mockContext"
import { exportContextMenuToEnterprise } from "./exportToEnterprise"

describe("exportContextMenuToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportContextMenuToEnterprise(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportContextMenuToEnterprise(mockContext, fullContextMenu)

    expect(result).toEqual(fullContextMenuEnterprise)
  })

  it("should export minimal", () => {
    const result = exportContextMenuToEnterprise(mockContext, minimalContextMenu)

    expect(result).toBeUndefined()
  })
})
