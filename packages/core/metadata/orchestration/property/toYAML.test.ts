import { describe, expect, it } from "vitest"
import { mockContext, mockContextToYAML } from "~/tests/mockContext"
import { exportPropertiesToYAML, exportPropertyToYAML } from "./toYAML"
import type { MetadataItemRule, PropertyRule } from "./types"

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

describe("exportPropertyToYAML", () => {
  it("omits values equal to implicitValueYAML", () => {
    const rule = {
      yaml: "Поле",
      type: "string",
      implicitValueYAML: "model-default",
    } as const satisfies PropertyRule

    expect(
      exportPropertyToYAML({
        context: { ...mockContext, exportToYAML: { toTyped: false } },
        rule,
        value: "model-default",
      })
    ).toBeUndefined()
  })

  it("omits converted values when source value equals implicitValueYAML", () => {
    const rule = {
      yaml: "Флаг",
      type: "boolean",
      implicitValueYAML: false,
      omitImplicitValueYAMLBySource: true,
    } as const satisfies PropertyRule

    expect(
      exportPropertyToYAML({
        context: { ...mockContext, exportToYAML: { toTyped: false } },
        rule,
        value: false,
      })
    ).toBeUndefined()
  })
})
