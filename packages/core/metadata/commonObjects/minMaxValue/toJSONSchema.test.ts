import { Type } from "typebox"
import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../orchestration"
import { exportPropertyToJSONSchema } from "../../orchestration/property/toJSONSchema"
import { mockContext } from "../../../tests/mockContext"
import "./toJSONSchema"

const rule: PropertyRule = {
  type: "MinMaxValue",
  yaml: "МинимальноеЗначение",
}

describe("exportMinMaxValueToJSONSchema", () => {
  it("exports number schema", () => {
    const result = exportPropertyToJSONSchema({
      context: mockContext,
      rule,
      value: undefined,
    })

    expect(result).toEqual(Type.Number())
  })
})
