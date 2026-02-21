import { describe, expect, it } from "vitest"
import { importPropertyFromYAML, PropertyRule } from "~/metadata/metadataFactory"
import {
  fullContextMenu,
  fullContextMenuSource,
  fullContextMenuYAML,
  minimalContextMenu,
  minimalContextMenuYAML,
} from "~/tests/fixtures/forms/contextMenu/data"
import { mockContext } from "~/tests/mockContext"

const rule: PropertyRule<any> = { type: "ContextMenu" }

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
