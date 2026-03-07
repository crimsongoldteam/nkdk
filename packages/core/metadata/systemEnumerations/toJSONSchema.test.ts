import { describe, expect, it } from "vitest"
import { ChildFormItemsGroupFromYAML } from "~/metadata/systemEnumerations/types"
import { mockContext } from "~/tests/mockContext"
import { exportSystemEnumerationToJSONSchema } from "./toJSONSchema"

describe("exportSystemEnumerationToJSONSchema", () => {
  it("возвращает Union из литералов YAML-значений для известного typeSE", () => {
    const rule = { type: "SystemEnumeration" as const, typeSE: "ChildFormItemsGroup" }
    const schema = exportSystemEnumerationToJSONSchema({
      context: mockContext,
      rule,
      value: undefined,
    })
    const schemaObj = schema as { anyOf?: Array<{ const: string }> }
    expect(schemaObj.anyOf).toBeDefined()
    const consts = schemaObj.anyOf!.map((s) => s.const).sort()
    const expected = Object.keys(ChildFormItemsGroupFromYAML).sort()
    expect(consts).toEqual(expected)
  })

  it("выбрасывает ошибку для неизвестного typeSE", () => {
    const rule = { type: "SystemEnumeration" as const, typeSE: "UnknownEnumeration" }
    expect(() =>
      exportSystemEnumerationToJSONSchema({
        context: mockContext,
        rule,
        value: undefined,
      })
    ).toThrow("Enumeration UnknownEnumeration not found")
  })
})
