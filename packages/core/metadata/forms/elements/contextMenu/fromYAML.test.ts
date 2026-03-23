import { describe, expect, it } from "vitest"
import {
  fullContextMenu,
  fullContextMenuSource,
  fullContextMenuYAML,
  minimalContextMenu,
  minimalContextMenuYAML,
} from "~/metadata/forms/elements/contextMenu/__fixtures__/data"
import { importPropertyFromYAML, PropertyRule } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"

const rule: PropertyRule = { type: "ContextMenu" }

describe("importContextMenuFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule: rule,
      value: fullContextMenuYAML,
      sourceValue: fullContextMenuSource,
    })

    expect(result).toEqual(fullContextMenu)
  })

  it("should import minimal", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule: rule,
      value: minimalContextMenuYAML,
      sourceValue: minimalContextMenu,
    })

    expect(result).toEqual(minimalContextMenu)
  })
})
