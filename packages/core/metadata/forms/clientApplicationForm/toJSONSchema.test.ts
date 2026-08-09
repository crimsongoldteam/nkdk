import { beforeAll, describe, expect, it } from "vitest"
import { getTypeRule } from "../../ruleRuntime"
import { exportPropertyToJSONSchema } from "../../ruleRuntime/property/toJSONSchema"
import { registerCoreMetadata } from "../../register"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { mockContext } from "../../../tests/mockContext"
import { ClientApplicationFormRules } from "./rules"
import { exportClientApplicationFormToJSONSchema } from "./toJSONSchema"

registerCoreMetadata()

let usePurposesSchema: ReturnType<typeof compileValidationSchema>

describe("ClientApplicationForm exportToJSONSchema type rule", () => {
  beforeAll(() => {
    const schema = exportPropertyToJSONSchema({
      context: mockContext,
      rule: ClientApplicationFormRules.properties.usePurposes,
      value: undefined,
    })
    if (schema === undefined) throw new Error("UsePurposes schema is not registered")
    usePurposesSchema = compileValidationSchema(schema)
  })

  it("registers client form JSON Schema exporter", () => {
    const exportToJSONSchema = getTypeRule("ClientApplicationForm", "exportToJSONSchema")
    expect(exportToJSONSchema).toBe(exportClientApplicationFormToJSONSchema)
  })

  it.each([
    ["МобильноеПриложение", true],
    ["ПлатформаИМобильноеПриложение", true],
    ["Произвольное", false],
  ])("validates use purpose %s", (yaml, expected) => {
    expect(usePurposesSchema.Check(yaml)).toBe(expected)
  })
})
