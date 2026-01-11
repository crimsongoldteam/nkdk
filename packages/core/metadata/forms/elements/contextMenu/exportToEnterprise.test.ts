import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToEnterprise"
import { fullContextMenu, fullContextMenuEnterprise, minimalContextMenu } from "~/tests/fixtures/forms/contextMenu/data"
import { mockСontext } from "~/tests/mockContext"
import { exportContextMenuToEnterprise } from "./exportToEnterprise"

describe("exportContextMenuToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportContextMenuToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportContextMenuToEnterprise(mockСontext, fullContextMenu)

    expect(result).toEqual(fullContextMenuEnterprise)
  })

  it("should export minimal", () => {
    const result = exportContextMenuToEnterprise(mockСontext, minimalContextMenu)

    expect(result).toBeUndefined()
  })
})
