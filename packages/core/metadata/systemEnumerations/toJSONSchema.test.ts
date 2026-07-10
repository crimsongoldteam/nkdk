import { describe, expect, it } from "vitest"
import { Value } from "typebox/value"
import { ChildFormItemsGroupFromYAML, SystemEnumerationPropertyRule } from "./types"
import { mockContext } from "../../tests/mockContext"
import { exportSystemEnumerationToJSONSchema } from "./toJSONSchema"

describe("exportSystemEnumerationToJSONSchema", () => {
  it("возвращает Union из литералов YAML-значений для известного typeSE", () => {
    const rule: SystemEnumerationPropertyRule = { type: "SystemEnumeration" as const, typeSE: "ChildFormItemsGroup" }
    const schema = exportSystemEnumerationToJSONSchema({
      context: mockContext,
      rule,
      value: undefined,
    })
    expect(schema).toBeDefined()
    if (schema === undefined) throw new Error("schema is undefined")

    const schemaObj = schema as { anyOf?: Array<{ const: string }> }
    expect(schemaObj.anyOf).toBeDefined()
    const consts = schemaObj.anyOf!.map((s) => s.const).sort()
    const expected = Object.keys(ChildFormItemsGroupFromYAML).sort()
    expect(consts).toEqual(expected)
    expect(Value.Check(schema, "UnknownCompatibilityMode")).toBe(false)
  })

  it("возвращает литералы для CompatibilityMode", () => {
    const rule: SystemEnumerationPropertyRule<"CompatibilityMode"> = {
      type: "SystemEnumeration",
      typeSE: "CompatibilityMode",
    }

    const schema = exportSystemEnumerationToJSONSchema({
      context: mockContext,
      rule,
      value: undefined,
    })
    expect(schema).toBeDefined()
    if (schema === undefined) throw new Error("schema is undefined")

    expect(Value.Check(schema, "Версия8_3_27")).toBe(true)
    expect(Value.Check(schema, "UnknownCompatibilityMode")).toBe(false)
    expect(Value.Check(schema, "")).toBe(false)
  })
})
