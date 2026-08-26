import { parseMetadataYaml } from "@nkdk/runtime"
import { createPropertyRuleExecutor, createRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { describe, expect, it } from "vitest"
import { mockContext } from "../../../../tests/mockContext"
import { compileValidationSchema } from "../../../validation/compileValidationSchema"
import { exportPropertyToJSONSchema } from "../../../ruleRuntime/property/toJSONSchema"
import { metadataRules } from "../../../composition/metadataRules"

import "./toJSONSchema"

describe("DcsLocalStringType JSON Schema", () => {
  const execution = createPropertyRuleExecutor(createRuleRegistrySet(metadataRules).property)

  it.each([
    "Представление: Текст",
    "Представление: !xml/string Текст",
  ])("validates tagged and ordinary scalar equally: %s", (source) => {
    const schema = exportPropertyToJSONSchema({
      context: mockContext,
      rule: { type: "DcsLocalStringType", yaml: "Представление" },
      value: undefined,
      execution,
    })
    const compiled = compileValidationSchema(schema!)
    const yaml = parseMetadataYaml(source).data as Record<string, unknown>

    expect(compiled.Check(yaml.Представление)).toBe(true)
  })
})
