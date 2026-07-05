import { compileValidationSchema } from "./../../validation/compileValidationSchema"
import { describe, expect, it } from "vitest"
import "../../commonObjects/boolean/toJSONSchema"
import "../../commonObjects/number/toJSONSchema"
import "../../commonObjects/string/toJSONSchema"
import "../../systemEnumerations/toJSONSchema"
import { mockContext } from "../../../tests/mockContext"
import { exportPropertyToJSONSchema } from "./toJSONSchema"

describe("exportPropertyToJSONSchema implicitValueYAML", () => {
  it("excludes implicit boolean YAML value from an enum-like schema", () => {
    const schema = exportPropertyToJSONSchema({
      context: mockContext,
      rule: { type: "boolean", implicitValueYAML: true },
      value: undefined,
    })

    if (schema === undefined) throw new Error("Expected JSON schema")
    const check = compileValidationSchema(schema)

    expect(check.Check("Истина")).toBe(false)
    expect(check.Check("Ложь")).toBe(true)
  })

  it("excludes implicit SystemEnumeration YAML value from an enum-like schema", () => {
    const schema = exportPropertyToJSONSchema({
      context: mockContext,
      rule: { type: "SystemEnumeration", typeSE: "ModalityUseMode", implicitValueYAML: "Использовать" },
      value: undefined,
    })

    if (schema === undefined) throw new Error("Expected JSON schema")
    const check = compileValidationSchema(schema)

    expect(check.Check("Использовать")).toBe(false)
    expect(check.Check("НеИспользовать")).toBe(true)
  })

  it("excludes implicit number YAML value from a free number schema", () => {
    const schema = exportPropertyToJSONSchema({
      context: mockContext,
      rule: { type: "number", implicitValueYAML: 9 },
      value: undefined,
    })

    if (schema === undefined) throw new Error("Expected JSON schema")
    const check = compileValidationSchema(schema)

    expect(check.Check(9)).toBe(false)
    expect(check.Check(8)).toBe(true)
    expect(check.Check("9")).toBe(false)
  })

  it("excludes implicit string YAML value from a free string schema, including empty string", () => {
    const schema = exportPropertyToJSONSchema({
      context: mockContext,
      rule: { type: "string", implicitValueYAML: "" },
      value: undefined,
    })

    if (schema === undefined) throw new Error("Expected JSON schema")
    const check = compileValidationSchema(schema)

    expect(check.Check("")).toBe(false)
    expect(check.Check("значение")).toBe(true)
    expect(check.Check(0)).toBe(false)
  })

  it("does not exclude defaultValue when implicitValueYAML is absent", () => {
    const schema = exportPropertyToJSONSchema({
      context: mockContext,
      rule: { type: "boolean", defaultValue: true },
      value: undefined,
    })

    if (schema === undefined) throw new Error("Expected JSON schema")
    const check = compileValidationSchema(schema)

    expect(check.Check("Истина")).toBe(true)
    expect(check.Check("Ложь")).toBe(true)
  })

  it("does not exclude function implicitValueYAML because it needs item context", () => {
    const schema = exportPropertyToJSONSchema({
      context: mockContext,
      rule: { type: "string", implicitValueYAML: ({ name }: { name?: string }) => name ?? "" },
      value: undefined,
    })

    if (schema === undefined) throw new Error("Expected JSON schema")
    const check = compileValidationSchema(schema)

    expect(check.Check("")).toBe(true)
    expect(check.Check("Документ")).toBe(true)
  })
})
