import { describe, expect, it } from "vitest"
import { exportPropertyToYAML } from "~/metadata/metadataFactory"
import { PropertyRule } from "~/metadata/metadataFactory/properties/types"
import { fullContextMenu, fullContextMenuYAML } from "~/tests/fixtures/forms/contextMenu/data"
import { mockContext } from "~/tests/mockContext"

const rule: PropertyRule = {
  type: "ContextMenu",
  yaml: "КонтекстноеМеню",
}

describe("exportContextMenuToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPropertyToYAML({
      context: mockContext,
      rule: rule,
      value: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should export all fields to YAML", () => {
    const result = exportPropertyToYAML({
      context: mockContext,
      rule: rule,
      value: fullContextMenu,
    })

    expect(result).toHaveProperty("КонтекстноеМеню", fullContextMenuYAML)
  })
})
