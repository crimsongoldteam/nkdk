import { describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { getValidationSchemaRef } from "../../ruleRuntime/jsonSchemaRefs"
import { exportPropertyToJSONSchema } from "../../ruleRuntime/property/toJSONSchema"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import "./register"


describe("ClientApplicationInterfaceItems JSON Schema", () => {
  it("показывает ПустоеОпределение только validation-схеме", () => {
    const rule = { type: "ClientApplicationInterfaceItems" } as PropertyRule
    const validationRef = exportPropertyToJSONSchema({
      context: {
        ...mockContext,
        exportToJSONSchema: {
          mode: "inline",
          refs: new Set<string>(),
          validationPropertyRefs: true,
        },
      },
      rule,
      value: undefined,
    })
    const refName = (validationRef as { $ref?: string } | undefined)?.$ref
    if (refName === undefined) throw new Error("Expected validation ref")
    const validationSchema = getValidationSchemaRef(refName)
    if (validationSchema === undefined) throw new Error(`Expected schema ${refName}`)
    const validation = compileValidationSchema(validationSchema)

    const hintSchema = exportPropertyToJSONSchema({
      context: {
        ...mockContext,
        exportToJSONSchema: { mode: "externalRefs", refs: new Set<string>() },
      },
      rule,
      value: undefined,
    })
    if (hintSchema === undefined) throw new Error("Expected hint schema")

    expect(validation.Check([{
      Панель: {
        UUID: "8e10648b-f52d-4ec2-b4dd-87de33778d95",
        ПустоеОпределение: "!xml",
      },
    }])).toBe(true)
    expect(validation.Check([{
      Панель: {
        UUID: "!xml 8e10648b-f52d-4ec2-b4dd-87de33778d95",
      },
    }])).toBe(false)
    expect(JSON.stringify(hintSchema)).not.toContain("ПустоеОпределение")
  })
})
