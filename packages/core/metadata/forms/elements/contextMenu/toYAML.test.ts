import { describe, expect, it } from "vitest"
import { fullContextMenu, fullContextMenuYAML } from "~/metadata/forms/elements/contextMenu/__fixtures__/data"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"

const rule: PropertyRule = {
  type: "ContextMenu",
  yaml: "КонтекстноеМеню",
}

describe("export ContextMenu to YAML", () => {
  it("should export minimal", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should export full to YAML", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: fullContextMenu,
    })

    expect(result).toEqual({ КонтекстноеМеню: fullContextMenuYAML })
  })
})
