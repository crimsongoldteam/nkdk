import { Type } from "typebox"
import { describe, expect, it } from "vitest"
import {
  attachCollectedSchemaRefs,
  collectSchemaRefs,
  createJSONSchemaExportContext,
  createSchemaRef,
  exportPropertyExternalRefSchema,
  recordOfSchemaRef,
  stripCollectedSchemaRefs,
} from "./jsonSchemaRefs"
import { exportPropertyToJSONSchema } from "./property/toJSONSchema"
import { compileValidationSchema } from "../validation/compileValidationSchema"
import { createRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { defineMetadataRules } from "./definition"
import { emptyMetadataRules } from "./definition/testSupport"
import { createValidationSchemaTestSession } from "./jsonSchemaTestSupport"
import "../commonObjects/metadataPath/toJSONSchema"
import "../commonObjects/number/toJSONSchema"
import "../commonObjects/string/toJSONSchema"
import "../forms/commonObjects/event/toJSONSchema"

const baseContext = {
  languages: { default: "ru", registered: ["ru"], registeredSet: new Set(["ru"]), version: '["ru",["ru"]]' },
  version: "2.20",
} as const

describe("jsonSchemaRefs", () => {
  it("creates stable nkdk schema refs", () => {
    expect(createSchemaRef("InputField")).toBe("nkdk://schema/InputField")
  })

  it("collects nested nkdk schema refs from arbitrary schema nodes", () => {
    expect(
      collectSchemaRefs({
        type: "object",
        properties: {
          Реквизиты: {
            type: "object",
            additionalProperties: { $ref: "nkdk://schema/MetadataAttribute" },
          },
          Inline: { $ref: "#/$defs/Local" },
        },
        "x-nkdk-schemaRefs": ["nkdk://schema/FormAttribute"],
      })
    ).toEqual(["nkdk://schema/FormAttribute", "nkdk://schema/MetadataAttribute"])
  })

  it("removes collected ref metadata without changing schema refs", () => {
    expect(
      stripCollectedSchemaRefs({
        type: "object",
        "x-nkdk-schemaRefs": ["nkdk://schema/FormAttribute"],
        properties: {
          Реквизиты: { $ref: "nkdk://schema/FormAttribute" },
        },
      })
    ).toEqual({
      type: "object",
      properties: {
        Реквизиты: { $ref: "nkdk://schema/FormAttribute" },
      },
    })
  })

  it("returns a property ref only in externalRefs mode and collects the ref", () => {
    const propertyRef = () =>
      recordOfSchemaRef("TestMetadataAttributeRefOnly")

    const inlineContext = createJSONSchemaExportContext(baseContext, "inline", { propertyRef })
    expect(
      exportPropertyExternalRefSchema({
        context: inlineContext,
        rule: { type: "TestMetadataAttributesRefOnly" as any },
      })
    ).toBeUndefined()

    const refContext = createJSONSchemaExportContext(baseContext, "externalRefs", { propertyRef })
    expect(
      exportPropertyExternalRefSchema({
        context: refContext,
        rule: { type: "TestMetadataAttributesRefOnly" as any },
      })
    ).toEqual({
      type: "object",
      additionalProperties: { $ref: "nkdk://schema/TestMetadataAttributeRefOnly" },
    })

    expect(attachCollectedSchemaRefs(refContext, Type.Object({}))).toMatchObject({
      "x-nkdk-schemaRefs": ["nkdk://schema/TestMetadataAttributeRefOnly"],
    })
  })

  it("uses registered refs through property JSON Schema export", () => {
    const propertyRef = () =>
      recordOfSchemaRef("TestMetadataAttributePropertyExport")

    const context = createJSONSchemaExportContext(baseContext, "externalRefs", { propertyRef })
    expect(
      exportPropertyToJSONSchema({
        context,
        rule: { type: "TestMetadataAttributesPropertyExport" as any },
        value: undefined,
      })
    ).toEqual({
      type: "object",
      additionalProperties: { $ref: "nkdk://schema/TestMetadataAttributePropertyExport" },
    })

    expect(attachCollectedSchemaRefs(context, Type.Object({}))).toMatchObject({
      "x-nkdk-schemaRefs": ["nkdk://schema/TestMetadataAttributePropertyExport"],
    })
  })

  it("exports an opt-in validation property ref after implicit values are excluded", () => {
    const session = createValidationSchemaTestSession(baseContext, "inline", {
      excludeImplicitValueYAML: true,
    })
    const schema = exportPropertyToJSONSchema({
      context: session.context,
      rule: { type: "number", implicitValueYAML: 1 },
      value: undefined,
    })

    expect(schema).toEqual({ $ref: "nkdk://schema/validation/2.20/ru/number/without-1" })
    expect(attachCollectedSchemaRefs(session.context, Type.Object({}))).toMatchObject({
      "x-nkdk-schemaRefs": ["nkdk://schema/validation/2.20/ru/number/without-1"],
    })

    const registeredSchema = session.get("nkdk://schema/validation/2.20/ru/number/without-1")
    if (registeredSchema === undefined) throw new Error("Expected registered validation schema")
    const check = compileValidationSchema(registeredSchema)
    expect(check.Check(1)).toBe(false)
    expect(check.Check(2)).toBe(true)
  })

  it("keeps bounded number validation schemas separate", () => {
    const session = createValidationSchemaTestSession(baseContext, "inline", {
      excludeImplicitValueYAML: true,
    })

    const first = exportPropertyToJSONSchema({
      context: session.context,
      rule: { type: "number", minimum: 0, maximum: 50, implicitValueYAML: 9 },
      value: undefined,
    })
    const second = exportPropertyToJSONSchema({
      context: session.context,
      rule: { type: "number", minimum: 1, maximum: 250, implicitValueYAML: 9 },
      value: undefined,
    })

    expect(first).toEqual({ $ref: "nkdk://schema/validation/2.20/ru/number/0..50/without-9" })
    expect(second).toEqual({ $ref: "nkdk://schema/validation/2.20/ru/number/1..250/without-9" })
    expect(session.get("nkdk://schema/validation/2.20/ru/number/0..50/without-9")).toMatchObject({
      allOf: [{ type: "number", minimum: 0, maximum: 50 }, { not: { type: "number", const: 9 } }],
    })
    expect(session.get("nkdk://schema/validation/2.20/ru/number/1..250/without-9")).toMatchObject({
      allOf: [{ type: "number", minimum: 1, maximum: 250 }, { not: { type: "number", const: 9 } }],
    })
  })

  it("exports default validation refs for reusable property types without opt-in registration", () => {
    const rules = createRuleRegistrySet(defineMetadataRules({
      ...emptyMetadataRules,
      propertyTypes: {
        TestReusableProperty: {
          exportToJSONSchema: () => Type.Object({ Значение: Type.String() }),
        },
      },
    }))
    const session = createValidationSchemaTestSession(baseContext, "inline")
    const schema = exportPropertyToJSONSchema({
      context: session.context,
      rule: { type: "TestReusableProperty" as any },
      value: undefined,
      execution: rules.execution,
    })

    expect(schema).toEqual({ $ref: "nkdk://schema/validation/2.20/ru/TestReusableProperty/base" })
    expect(attachCollectedSchemaRefs(session.context, Type.Object({}))).toMatchObject({
      "x-nkdk-schemaRefs": ["nkdk://schema/validation/2.20/ru/TestReusableProperty/base"],
    })
    expect(session.get("nkdk://schema/validation/2.20/ru/TestReusableProperty/base")).toEqual({
      type: "object",
      properties: {
        Значение: { type: "string" },
      },
      required: ["Значение"],
    })
  })

  it("keeps explicit validation inline exceptions inline", () => {
    const { context } = createValidationSchemaTestSession(baseContext, "inline")

    expect(
      exportPropertyToJSONSchema({
        context,
        rule: { type: "DataPath", yaml: "ПутьКДанным" },
        value: undefined,
      })
    ).not.toMatchObject({ $ref: expect.any(String) })
    expect(
      exportPropertyToJSONSchema({
        context,
        rule: { type: "Events", yaml: "События", items: { open: "ПриОткрытии" } },
        value: undefined,
      })
    ).toEqual({
      type: "object",
      properties: {
        ПриОткрытии: {
          anyOf: [
            { type: "string" },
            {
              type: "object",
              properties: {
                Перед: { type: "string" },
                После: { type: "string" },
                Вместо: { type: "string" },
              },
              minProperties: 1,
              additionalProperties: false,
            },
          ],
        },
      },
      additionalProperties: false,
    })
  })

  it("uses stable scalar validation keys for implicit values", () => {
    const session = createValidationSchemaTestSession(baseContext, "inline", {
      excludeImplicitValueYAML: true,
    })

    const numberSchema = exportPropertyToJSONSchema({
      context: session.context,
      rule: { type: "number", implicitValueYAML: 0 },
      value: undefined,
    })
    const stringSchema = exportPropertyToJSONSchema({
      context: session.context,
      rule: { type: "string", implicitValueYAML: "" },
      value: undefined,
    })

    expect(numberSchema).toEqual({ $ref: "nkdk://schema/validation/2.20/ru/number/without-0" })
    expect(stringSchema).toEqual({ $ref: "nkdk://schema/validation/2.20/ru/string/without-empty" })
    expect(session.get("nkdk://schema/validation/2.20/ru/number/without-0")).toMatchObject({
      allOf: [{ type: "number" }, { not: { type: "number", const: 0 } }],
    })
    expect(session.get("nkdk://schema/validation/2.20/ru/string/without-empty")).toMatchObject({
      allOf: [{ type: "string" }, { not: { type: "string", const: "" } }],
    })
  })

  it("keeps validation property schemas inline outside validation export", () => {
    const context = createJSONSchemaExportContext(baseContext, "inline", { excludeImplicitValueYAML: true })

    expect(
      exportPropertyToJSONSchema({
        context,
        rule: { type: "boolean", implicitValueYAML: true },
        value: undefined,
      })
    ).not.toMatchObject({ $ref: expect.any(String) })
    expect(attachCollectedSchemaRefs(context, Type.Object({}))).not.toHaveProperty("x-nkdk-schemaRefs")
  })

})
