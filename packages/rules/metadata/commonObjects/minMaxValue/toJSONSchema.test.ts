import { Type } from "typebox"
import { describe, expect, it } from "vitest"
import { createRuleRegistrySet, PropertyRule } from "@nkdk/runtime/rule-kit"
import { exportPropertyToJSONSchema } from "../../ruleRuntime/property/toJSONSchema"
import { metadataRules } from "../../composition/metadataRules"
import { mockContext } from "../../../tests/mockContext"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import "./toJSONSchema"

const rule: PropertyRule = {
  type: "MinMaxValue",
  yaml: "МинимальноеЗначение",
}

const execution = createRuleRegistrySet(metadataRules).execution

describe("exportMinMaxValueToJSONSchema", () => {
  it("exports number schema", () => {
    const result = exportPropertyToJSONSchema({
      context: mockContext,
      rule,
      value: undefined,
      execution,
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
      execution,
    })
    const external = exportPropertyToJSONSchema({ context: mockContext, rule, value: undefined, execution })
    if (internal === undefined || external === undefined) throw new Error("MinMaxValue schema is missing")
    const internalCheck = compileValidationSchema({}, internal)
    const externalCheck = compileValidationSchema({}, external)

    expect(internalCheck.Check("!xml/value 001.00")).toBe(true)
    expect(internalCheck.Check("!xml/type xs:dateTime bad")).toBe(true)
    expect(internalCheck.Check("!xml/value")).toBe(false)
    expect(internalCheck.Check("!xml/type xs:string")).toBe(false)
    expect(externalCheck.Check("!xml/value 001.00")).toBe(false)
  })
})
