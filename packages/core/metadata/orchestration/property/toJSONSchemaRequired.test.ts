import { Type, type TProperties } from "@sinclair/typebox"
import { describe, expect, it } from "vitest"
import { AutoCommandBarRules } from "~/metadata/forms/elements/autoCommandBar/rules"
import { ColumnGroupRules } from "~/metadata/forms/elements/columnGroup/rules"
import { UsualGroupRules } from "~/metadata/forms/elements/usualGroup/rules"
import { mockContext } from "~/tests/mockContext"
import { exportPropertiesToJSONSchema } from "./toJSONSchema"
import type { MetadataItemRule, PropertyRule } from "./types"

describe("exportPropertiesToJSONSchema required YAML properties", () => {
  it("keeps required YAML properties non-optional", () => {
    const rule = {
      itemType: "RequiredYamlFixture",
      properties: {
        name: { yaml: "Имя", type: "string", required: true },
        comment: { yaml: "Комментарий", type: "string" },
      },
    } as const satisfies MetadataItemRule

    const schema = Type.Object(exportPropertiesToJSONSchema({ context: mockContext, rule }) as TProperties)

    expect(schema).toMatchObject({
      properties: {
        Имя: expect.objectContaining({ type: "string" }),
        Комментарий: expect.objectContaining({ type: "string" }),
      },
      required: ["Имя"],
    })
  })

  it("has no rules that combine required and implicitValueYAML", () => {
    const conflicts = [
      ...requiredImplicitConflicts(AutoCommandBarRules),
      ...requiredImplicitConflicts(ColumnGroupRules),
      ...requiredImplicitConflicts(UsualGroupRules),
    ]

    expect(conflicts).toEqual([])
  })
})

function requiredImplicitConflicts(rule: { properties: Record<string, PropertyRule> }): string[] {
  return Object.entries(rule.properties)
    .filter(([, propertyRule]) => propertyRule.required === true && "implicitValueYAML" in propertyRule)
    .map(([key]) => key)
}
