import { describe, expect, it } from "vitest"
import { mockContextToYAML } from "~/tests/mockContext"
import { exportPropertiesToYAML } from "./toYAML"
import type { MetadataItemRule } from "./types"

const singleTypeRule = {
  itemType: "MetadataAttribute",
  properties: {
    type: {
      yaml: "Тип",
      type: "TypeDescription",
      required: true,
    },
  },
} as const satisfies MetadataItemRule

describe("exportPropertiesToYAML", () => {
  it("keeps metadata items as objects when only one YAML property is exported", () => {
    const result = exportPropertiesToYAML({
      context: mockContextToYAML,
      rule: singleTypeRule,
      data: {
        itemType: "MetadataAttribute",
        name: "Организация",
        type: { type: ["CatalogRef.Организации"] },
      },
    })

    expect(result).toEqual({ Тип: "Справочник.Организации" })
  })
})
