import { Type } from "typebox"
import { describe, expect, it } from "vitest"
import {
  attachCollectedSchemaRefs,
  collectSchemaRefs,
  createJSONSchemaExportContext,
  createSchemaRef,
  exportPropertyExternalRefSchema,
  getValidationSchemaRef,
  getJSONSchemaIdentityExporter,
  listJSONSchemaIdentityNames,
  recordOfSchemaRef,
  registerJSONSchemaIdentity,
  registerJSONSchemaPropertyRef,
  stripCollectedSchemaRefs,
} from "./jsonSchemaRefs"
import { exportPropertyToJSONSchema } from "./property/toJSONSchema"
import { registerTypeRule } from "./property/typeRuleRegistry"
import { compileValidationSchema } from "../validation/compileValidationSchema"
import "../commonObjects/metadataPath/toJSONSchema"
import "../commonObjects/number/toJSONSchema"
import "../commonObjects/string/toJSONSchema"
import "../forms/commonObjects/event/toJSONSchema"

const baseContext = {
  defaultLanguage: "ru",
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
    registerJSONSchemaPropertyRef("TestMetadataAttributesRefOnly" as any, () =>
      recordOfSchemaRef("TestMetadataAttributeRefOnly")
    )

    const inlineContext = createJSONSchemaExportContext(baseContext, "inline")
    expect(
      exportPropertyExternalRefSchema({
        context: inlineContext,
        rule: { type: "TestMetadataAttributesRefOnly" as any },
      })
    ).toBeUndefined()

    const refContext = createJSONSchemaExportContext(baseContext, "externalRefs")
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
    registerJSONSchemaPropertyRef("TestMetadataAttributesPropertyExport" as any, () =>
      recordOfSchemaRef("TestMetadataAttributePropertyExport")
    )

    const context = createJSONSchemaExportContext(baseContext, "externalRefs")
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
    const context = createJSONSchemaExportContext(baseContext, "inline", {
      excludeImplicitValueYAML: true,
      validationPropertyRefs: true,
    })
    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "number", implicitValueYAML: 1 },
      value: undefined,
    })

    expect(schema).toEqual({ $ref: "nkdk://schema/validation/2.20/ru/number/without-1" })
    expect(attachCollectedSchemaRefs(context, Type.Object({}))).toMatchObject({
      "x-nkdk-schemaRefs": ["nkdk://schema/validation/2.20/ru/number/without-1"],
    })

    const registeredSchema = getValidationSchemaRef("nkdk://schema/validation/2.20/ru/number/without-1")
    if (registeredSchema === undefined) throw new Error("Expected registered validation schema")
    const check = compileValidationSchema(registeredSchema)
    expect(check.Check(1)).toBe(false)
    expect(check.Check(2)).toBe(true)
  })

  it("exports default validation refs for reusable property types without opt-in registration", () => {
    registerTypeRule("TestReusableProperty" as any, "exportToJSONSchema", () =>
      Type.Object({
        Значение: Type.String(),
      })
    )

    const context = createJSONSchemaExportContext(baseContext, "inline", {
      validationPropertyRefs: true,
    })
    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "TestReusableProperty" as any },
      value: undefined,
    })

    expect(schema).toEqual({ $ref: "nkdk://schema/validation/2.20/ru/TestReusableProperty/base" })
    expect(attachCollectedSchemaRefs(context, Type.Object({}))).toMatchObject({
      "x-nkdk-schemaRefs": ["nkdk://schema/validation/2.20/ru/TestReusableProperty/base"],
    })
    expect(getValidationSchemaRef("nkdk://schema/validation/2.20/ru/TestReusableProperty/base")).toEqual({
      type: "object",
      properties: {
        Значение: { type: "string" },
      },
      required: ["Значение"],
    })
  })

  it("keeps explicit validation inline exceptions inline", () => {
    const context = createJSONSchemaExportContext(baseContext, "inline", {
      validationPropertyRefs: true,
    })

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
        ПриОткрытии: { type: "string" },
      },
      additionalProperties: false,
    })
  })

  it("uses stable scalar validation keys for implicit values", () => {
    const context = createJSONSchemaExportContext(baseContext, "inline", {
      excludeImplicitValueYAML: true,
      validationPropertyRefs: true,
    })

    const numberSchema = exportPropertyToJSONSchema({
      context,
      rule: { type: "number", implicitValueYAML: 0 },
      value: undefined,
    })
    const stringSchema = exportPropertyToJSONSchema({
      context,
      rule: { type: "string", implicitValueYAML: "" },
      value: undefined,
    })

    expect(numberSchema).toEqual({ $ref: "nkdk://schema/validation/2.20/ru/number/without-0" })
    expect(stringSchema).toEqual({ $ref: "nkdk://schema/validation/2.20/ru/string/without-empty" })
    expect(getValidationSchemaRef("nkdk://schema/validation/2.20/ru/number/without-0")).toMatchObject({
      allOf: [{ type: "number" }, { not: { type: "number", const: 0 } }],
    })
    expect(getValidationSchemaRef("nkdk://schema/validation/2.20/ru/string/without-empty")).toMatchObject({
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

  it("registers and lists named schema exporters", () => {
    const source = { itemType: "ListedSampleItem" }
    registerJSONSchemaIdentity({
      name: "ListedSampleItem",
      source,
      exporter: () => Type.Object({ Имя: Type.String() }),
    })

    expect(listJSONSchemaIdentityNames()).toContain("ListedSampleItem")
    expect(getJSONSchemaIdentityExporter("ListedSampleItem")?.({ context: baseContext })).toMatchObject({
      type: "object",
      properties: { Имя: { type: "string" } },
    })
  })

  it("allows idempotent registration for the same source", () => {
    const source = { itemType: "IdempotentSampleItem" }
    const exporter = () => Type.Object({})

    registerJSONSchemaIdentity({ name: "IdempotentSampleItem", source, exporter })
    registerJSONSchemaIdentity({ name: "IdempotentSampleItem", source, exporter })

    expect(listJSONSchemaIdentityNames()).toContain("IdempotentSampleItem")
  })

  it("keeps the first exporter for repeated schema names", () => {
    registerJSONSchemaIdentity({
      name: "DuplicateItem",
      source: { itemType: "Left" },
      exporter: () => Type.Object({ left: Type.String() }),
    })

    registerJSONSchemaIdentity({
      name: "DuplicateItem",
      source: { itemType: "Right" },
      exporter: () => Type.Object({ right: Type.String() }),
    })

    expect(getJSONSchemaIdentityExporter("DuplicateItem")?.({ context: baseContext })).toMatchObject({
      properties: { left: { type: "string" } },
    })
  })
})
