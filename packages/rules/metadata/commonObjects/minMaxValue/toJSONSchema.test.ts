import { Type } from "typebox"
import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../ruleRuntime"
import { exportPropertyToJSONSchema } from "../../ruleRuntime/property/toJSONSchema"
import { mockContext } from "../../../tests/mockContext"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
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

  it("allows registered !xml payload only in the internal validation schema", () => {
    const internal = exportPropertyToJSONSchema({
      context: {
        ...mockContext,
        exportToJSONSchema: { mode: "inline", refs: new Set(), explicitXMLValues: true },
      },
      rule,
      value: undefined,
    })
    const external = exportPropertyToJSONSchema({ context: mockContext, rule, value: undefined })
    if (internal === undefined || external === undefined) throw new Error("MinMaxValue schema is missing")
    const internalCheck = compileValidationSchema({}, internal)
    const externalCheck = compileValidationSchema({}, external)

    expect(internalCheck.Check("!xml String 001.00")).toBe(true)
    expect(internalCheck.Check("!xml Raw xs:dateTime bad")).toBe(true)
    expect(internalCheck.Check("!xml Decimal nope")).toBe(false)
    expect(internalCheck.Check("!xml Unknown 1")).toBe(false)
    expect(externalCheck.Check("!xml String 001.00")).toBe(false)
  })
})
