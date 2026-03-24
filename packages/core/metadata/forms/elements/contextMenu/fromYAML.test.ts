import { describe, expect, it } from "vitest"
import {
  fullContextMenu,
  fullContextMenuSource,
  fullContextMenuYAML,
  minimalContextMenu,
  minimalContextMenuYAML,
} from "~/metadata/forms/elements/contextMenu/__fixtures__/data"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"

const rule: PropertyRule = { type: "ContextMenu" }

describe("import ContextMenu from YAML", () => {
  it("should import full from YAML", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: fullContextMenuYAML,
      sourceValue: fullContextMenuSource,
    })

    expect(result).toEqual(fullContextMenu)
  })

  it("should import minimal", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: minimalContextMenuYAML,
      sourceValue: minimalContextMenu,
    })

    expect(result).toEqual(minimalContextMenu)
  })
})
