import { describe, expect, it } from "vitest"
import { enterNestedYamlRule, enterYamlProperty } from "./yamlRuleCursor"

describe("YamlRuleCursor", () => {
  it("enters a YAML property without dropping traversal fields", () => {
    const collector = {} as never
    const cursor = { yamlPath: ["Корень"] as const, rulePath: [] as const, collector }

    expect(enterYamlProperty({ cursor, propertyKey: "value", yamlKey: "Значение" })).toEqual({
      yamlPath: ["Корень", "Значение"],
      rulePath: [{ propertyKey: "value" }],
      collector,
    })
  })

  it("marks the last property as a nested item rule", () => {
    const cursor = {
      yamlPath: ["Элементы"] as const,
      rulePath: [{ propertyKey: "items" }] as const,
      collector: {} as never,
    }

    expect(enterNestedYamlRule(cursor, "TestItem").rulePath).toEqual([
      { propertyKey: "items", nestedItemType: "TestItem" },
    ])
  })

  it("leaves an empty rule path unchanged", () => {
    const cursor = { yamlPath: [] as const, rulePath: [] as const }

    expect(enterNestedYamlRule(cursor, "TestItem")).toBe(cursor)
  })
})
