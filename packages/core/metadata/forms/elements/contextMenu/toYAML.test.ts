import { describe, expect, it } from "vitest"
import { fullContextMenu, fullContextMenuYAML } from "~/metadata/forms/elements/contextMenu/__fixtures__/data"
import { exportPropertyToYAML } from "~/metadata/orchestration"
import { PropertyRule } from "~/metadata/orchestration/property/types"
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
