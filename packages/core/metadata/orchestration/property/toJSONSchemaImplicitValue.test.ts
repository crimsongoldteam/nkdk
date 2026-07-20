import { compileValidationSchema } from "./../../validation/compileValidationSchema"
import { describe, expect, it } from "vitest"
import "../../commonObjects/boolean/toJSONSchema"
import "../../commonObjects/number/toJSONSchema"
import "../../commonObjects/string/toJSONSchema"
import "../../systemEnumerations/toJSONSchema"
import { mockContext } from "../../../tests/mockContext"
import { exportPropertyToJSONSchema } from "./toJSONSchema"
import { getValidationSchemaRef } from "../jsonSchemaRefs"

const validationContext = {
  ...mockContext,
  exportToJSONSchema: {
    mode: "inline" as const,
    refs: new Set<string>(),
    excludeImplicitValueYAML: true,
  },
}

describe("exportPropertyToJSONSchema implicitValueYAML", () => {
  it("creates distinct validation refs for boolean implicit values", () => {
    const refs = [undefined, true, false].map((implicitValueYAML) => {
      const schema = exportPropertyToJSONSchema({
        context: {
          ...validationContext,
          exportToJSONSchema: { ...validationContext.exportToJSONSchema, validationPropertyRefs: true },
        },
        rule: { type: "boolean", implicitValueYAML },
        value: undefined,
      })
      return (schema as { $ref?: string } | undefined)?.$ref
    })

    expect(refs).toEqual([
      "nkdk://schema/validation/2.20/ru/boolean/base",
      "nkdk://schema/validation/2.20/ru/boolean/without-Истина",
      "nkdk://schema/validation/2.20/ru/boolean/without-Ложь",
    ])

    const withoutTruth = getValidationSchemaRef(refs[1]!)
    if (withoutTruth === undefined) throw new Error("Expected boolean validation schema")
    const check = compileValidationSchema(withoutTruth)
    expect(check.Check("Истина")).toBe(false)
    expect(check.Check("Ложь")).toBe(true)
  })

  it("creates distinct validation refs for SystemEnumeration implicit values", () => {
    const refs = ["Использовать", "НеИспользовать"].map((implicitValueYAML) => {
      const schema = exportPropertyToJSONSchema({
        context: {
          ...validationContext,
          exportToJSONSchema: { ...validationContext.exportToJSONSchema, validationPropertyRefs: true },
        },
        rule: { type: "SystemEnumeration", typeSE: "ModalityUseMode", implicitValueYAML },
        value: undefined,
      })
      return (schema as { $ref?: string } | undefined)?.$ref
    })

    expect(refs).toEqual([
      "nkdk://schema/validation/2.20/ru/SystemEnumeration/ModalityUseMode/without-Использовать",
      "nkdk://schema/validation/2.20/ru/SystemEnumeration/ModalityUseMode/without-НеИспользовать",
    ])

    const withoutUse = getValidationSchemaRef(refs[0]!)
    if (withoutUse === undefined) throw new Error("Expected SystemEnumeration validation schema")
    const check = compileValidationSchema(withoutUse)
    expect(check.Check("Использовать")).toBe(false)
    expect(check.Check("НеИспользовать")).toBe(true)
  })

  it("excludes implicit boolean YAML value from an enum-like schema", () => {
    const schema = exportPropertyToJSONSchema({
      context: validationContext,
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
      context: validationContext,
      rule: { type: "SystemEnumeration", typeSE: "ModalityUseMode", implicitValueYAML: "Использовать" },
      value: undefined,
    })

    if (schema === undefined) throw new Error("Expected JSON schema")
    const check = compileValidationSchema(schema)

    expect(check.Check("Использовать")).toBe(false)
    expect(check.Check("НеИспользовать")).toBe(true)
  })

  it("excludes implicit SystemEnumeration model value by its YAML representation", () => {
    const schema = exportPropertyToJSONSchema({
      context: validationContext,
      rule: { type: "SystemEnumeration", typeSE: "DocumentNumberType", implicitValueYAML: "String" },
      value: undefined,
    })

    if (schema === undefined) throw new Error("Expected JSON schema")
    const check = compileValidationSchema(schema)

    expect(check.Check("Строка")).toBe(false)
    expect(check.Check("Число")).toBe(true)
    expect(check.Check("String")).toBe(false)
  })

  it("excludes implicit number YAML value from a free number schema", () => {
    const schema = exportPropertyToJSONSchema({
      context: validationContext,
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
      context: validationContext,
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
      context: validationContext,
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
      context: validationContext,
      rule: { type: "string", implicitValueYAML: ({ name }: { name?: string }) => name ?? "" },
      value: undefined,
    })

    if (schema === undefined) throw new Error("Expected JSON schema")
    const check = compileValidationSchema(schema)

    expect(check.Check("")).toBe(true)
    expect(check.Check("Документ")).toBe(true)
  })
})
