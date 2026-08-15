import { describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { createValidationSchemaTestSession } from "../../ruleRuntime/jsonSchemaTestSupport"
import { exportPropertyToJSONSchema } from "../../ruleRuntime/property/toJSONSchema"
import { exportMetadataItemToJSONSchema } from "../../ruleRuntime/metadataItem/toJSONSchema"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { ClientApplicationInterfaceRules } from "./rules"
import "./register"


describe("ClientApplicationInterfaceItems JSON Schema", () => {
  it("проверяет ОтображениеПанелиРазделов как системное перечисление", () => {
    const validation = compileValidationSchema(
      exportMetadataItemToJSONSchema({ context: mockContext, rule: ClientApplicationInterfaceRules })
    )

    expect(validation.Check({ ОтображениеПанелиРазделов: "Текст" })).toBe(true)
    expect(validation.Check({ ОтображениеПанелиРазделов: "Неизвестно" })).toBe(false)
  })

  it("показывает ПустоеОпределение только validation-схеме", () => {
    const rule = { type: "ClientApplicationInterfaceItems" } as PropertyRule
    const session = createValidationSchemaTestSession(mockContext, "inline")
    const validationRef = exportPropertyToJSONSchema({
      context: session.context,
      rule,
      value: undefined,
    })
    const refName = (validationRef as { $ref?: string } | undefined)?.$ref
    if (refName === undefined) throw new Error("Expected validation ref")
    const validationSchema = session.get(refName)
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
        ПустоеОпределение: "!xml/present",
      },
    }])).toBe(true)
    expect(validation.Check([{
      Панель: {
        UUID: "!xml/present 8e10648b-f52d-4ec2-b4dd-87de33778d95",
      },
    }])).toBe(false)
    expect(validation.Check([{
      Панель: {
        UUID: "8e10648b-f52d-4ec2-b4dd-87de33778d95",
        Представление: "Текст",
      },
    }])).toBe(false)
    expect(JSON.stringify(hintSchema)).not.toContain("ПустоеОпределение")
  })
})
