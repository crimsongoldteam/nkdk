import { Type } from "typebox"
import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../ruleRuntime"
import { exportPropertyToJSONSchema } from "../../ruleRuntime/property/toJSONSchema"
import { mockContext } from "../../../tests/mockContext"
import "./toJSONSchema"

const rule: PropertyRule = {
  type: "StringOrNumber",
  yaml: "РезультатОтчета",
}

describe("exportStringOrNumberToJSONSchema", () => {
  it("exports string or number schema", () => {
    const result = exportPropertyToJSONSchema({
      context: mockContext,
      rule,
      value: undefined,
    })

    expect(result).toEqual(Type.Union([Type.String(), Type.Number()]))
  })
})
