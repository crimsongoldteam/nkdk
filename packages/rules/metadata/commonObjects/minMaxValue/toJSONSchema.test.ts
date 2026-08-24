import { createRuleRegistrySet,PropertyRule } from "@nkdk/runtime/rule-kit"
import { Type } from "typebox"
import { describe,expect,it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { metadataRules } from "../../composition/metadataRules"
import { exportPropertyToJSONSchema } from "../../ruleRuntime/property/toJSONSchema"
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
})
