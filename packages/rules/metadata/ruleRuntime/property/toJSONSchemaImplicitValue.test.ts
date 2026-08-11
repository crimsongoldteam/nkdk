import { compileValidationSchema } from "./../../validation/compileValidationSchema"
import { describe, expect, it } from "vitest"
import "../../commonObjects/boolean/toJSONSchema"
import "../../commonObjects/i8nText/toJSONSchema"
import "../../commonObjects/number/toJSONSchema"
import "../../commonObjects/string/toJSONSchema"
import "../../systemEnumerations/toJSONSchema"
import { mockContext } from "../../../tests/mockContext"
import { exportPropertyToJSONSchema } from "./toJSONSchema"
import {
  createJSONSchemaExportContext,
} from "../jsonSchemaRefs"
import { createValidationSchemaTestSession } from "../jsonSchemaTestSupport"
import type { PropertyRuleType } from "./registry"

const validationContext = {
  ...mockContext,
  exportToJSONSchema: {
    mode: "inline" as const,
    refs: new Set<string>(),
    excludeImplicitValueYAML: true,
  },
}

describe("exportPropertyToJSONSchema implicitValueYAML", () => {
  it.each([
    ["без неявного значения", { type: "boolean" }, ["Истина", "Ложь"]],
    ["с явным noImplicitValueYAML", { type: "boolean", noImplicitValueYAML: true }, ["Истина", "Ложь"]],
    ["с неявной Истиной", { type: "boolean", implicitValueYAML: true }, ["Ложь"]],
    ["с неявной Ложью", { type: "boolean", implicitValueYAML: false }, ["Истина"]],
  ] as const)("оставляет допустимые boolean-значения %s", (_name, rule, allowedValues) => {
    const schema = exportPropertyToJSONSchema({
      context: validationContext,
      rule,
      value: undefined,
    })
    if (schema === undefined) throw new Error("Expected boolean schema")
    const check = compileValidationSchema(schema)
    const allowed = new Set<string>(allowedValues)

    for (const value of ["Истина", "Ложь", "Авто"] as const) {
      expect(check.Check(value)).toBe(allowed.has(value))
    }
  })

  it("creates distinct validation refs for boolean implicit values", () => {
    const session = createValidationSchemaTestSession(mockContext, "inline", {
      excludeImplicitValueYAML: true,
    })
    const refs = [undefined, true, false].map((implicitValueYAML) => {
      const schema = exportPropertyToJSONSchema({
        context: session.context,
        rule: { type: "boolean", implicitValueYAML },
        value: undefined,
      })
      return (schema as { $ref?: string } | undefined)?.$ref
    })

    expect(refs).toEqual([
      "nkdk://schema/validation/2.20/ru/boolean/base",
      "nkdk://schema/validation/2.20/ru/boolean/without-true",
      "nkdk://schema/validation/2.20/ru/boolean/without-false",
    ])

    const withoutTruth = session.get(refs[1]!)
    if (withoutTruth === undefined) throw new Error("Expected boolean validation schema")
    const check = compileValidationSchema(withoutTruth)
    expect(check.Check("Истина")).toBe(false)
    expect(check.Check("Ложь")).toBe(true)
  })

  it("creates distinct validation refs for SystemEnumeration implicit values", () => {
    const session = createValidationSchemaTestSession(mockContext, "inline", {
      excludeImplicitValueYAML: true,
    })
    const refs = ["Use", "DontUse"].map((implicitValueYAML) => {
      const schema = exportPropertyToJSONSchema({
        context: session.context,
        rule: { type: "SystemEnumeration", typeSE: "ModalityUseMode", implicitValueYAML },
        value: undefined,
      })
      return (schema as { $ref?: string } | undefined)?.$ref
    })

    expect(refs).toEqual([
      "nkdk://schema/validation/2.20/ru/SystemEnumeration/ModalityUseMode/without-Use",
      "nkdk://schema/validation/2.20/ru/SystemEnumeration/ModalityUseMode/without-DontUse",
    ])

    const withoutUse = session.get(refs[0]!)
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

  it("excludes implicit empty string from an I8nText schema", () => {
    const schema = exportPropertyToJSONSchema({
      context: validationContext,
      rule: { type: "I8nText", implicitValueYAML: "" },
      value: undefined,
    })

    if (schema === undefined) throw new Error("Expected I8nText schema")
    const check = compileValidationSchema(schema)

    expect(check.Check("")).toBe(false)
    expect(check.Check("Явный синоним")).toBe(true)
    expect(check.Check({ ru: "Явный синоним", en: "Explicit synonym" })).toBe(true)
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

  it.each([false, true])("adds a property description with validation refs=%s", (validationPropertyRefs) => {
    const description = "Доступно только для таблицы динамического списка."
    const schema = exportPropertyToJSONSchema({
      context: {
        ...validationContext,
        exportToJSONSchema: {
          ...validationContext.exportToJSONSchema,
          ...(validationPropertyRefs ? { validationPropertyRefs: true as const } : {}),
        },
      },
      rule: { type: "number", description },
      value: undefined,
    })

    expect(schema).toMatchObject({ description })
    if (validationPropertyRefs) expect(schema).toHaveProperty("$ref")
    else expect(schema).toHaveProperty("type", "number")
  })

  it("combines a property description with an override description", () => {
    const schema = exportPropertyToJSONSchema({
      context: {
        ...validationContext,
        exportToJSONSchema: {
          ...validationContext.exportToJSONSchema,
          propertySchemaOverrides: { number: { type: "integer", description: "Описание типа." } },
        },
      },
      rule: { type: "number", description: "Описание свойства." },
      value: undefined,
    })

    expect(schema).toMatchObject({
      type: "integer",
      description: "Описание типа.\n\nОписание свойства.",
    })
  })

  it("adds a property description to an external property ref", () => {
    const type = "DescriptionExternalRefProbe" as PropertyRuleType

    const schema = exportPropertyToJSONSchema({
      context: createJSONSchemaExportContext(validationContext, "externalRefs", {
        propertyRef: () => ({ $ref: "nkdk://schema/DescriptionExternalRefProbe" }),
      }),
      rule: { type, description: "Описание свойства." },
      value: undefined,
    })

    expect(schema).toEqual({
      $ref: "nkdk://schema/DescriptionExternalRefProbe",
      description: "Описание свойства.",
    })
  })

  it("adds a property description when a type handler is absent", () => {
    const schema = exportPropertyToJSONSchema({
      context: validationContext,
      rule: {
        type: "DescriptionWithoutHandlerProbe" as PropertyRuleType,
        description: "Описание свойства.",
      },
      value: { type: "string" },
    })

    expect(schema).toEqual({ type: "string", description: "Описание свойства." })
  })

  it("does not create a schema for an absent value when a type handler is absent", () => {
    expect(
      exportPropertyToJSONSchema({
        context: validationContext,
        rule: {
          type: "DescriptionWithoutHandlerAbsentProbe" as PropertyRuleType,
          description: "Описание свойства.",
        },
        value: undefined,
      })
    ).toBeUndefined()
  })
})
