import { Type } from "typebox"
import { afterEach, describe, expect, it } from "vitest"
import {
  attachCollectedSchemaRefs,
  clearJSONSchemaRefRegistries,
  collectSchemaRefs,
  createJSONSchemaExportContext,
  createSchemaRef,
  exportPropertyExternalRefSchema,
  getJSONSchemaIdentityExporter,
  listJSONSchemaIdentityNames,
  recordOfSchemaRef,
  registerJSONSchemaIdentity,
  registerJSONSchemaPropertyRef,
  stripCollectedSchemaRefs,
} from "./jsonSchemaRefs"
import { exportPropertyToJSONSchema } from "./property/toJSONSchema"

const baseContext = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

describe("jsonSchemaRefs", () => {
  afterEach(() => {
    clearJSONSchemaRefRegistries()
  })

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
    registerJSONSchemaPropertyRef("MetadataAttributes", () => recordOfSchemaRef("MetadataAttribute"))

    const inlineContext = createJSONSchemaExportContext(baseContext, "inline")
    expect(
      exportPropertyExternalRefSchema({
        context: inlineContext,
        rule: { type: "MetadataAttributes" },
      })
    ).toBeUndefined()

    const refContext = createJSONSchemaExportContext(baseContext, "externalRefs")
    expect(
      exportPropertyExternalRefSchema({
        context: refContext,
        rule: { type: "MetadataAttributes" },
      })
    ).toEqual({
      type: "object",
      additionalProperties: { $ref: "nkdk://schema/MetadataAttribute" },
    })

    expect(attachCollectedSchemaRefs(refContext, Type.Object({}))).toMatchObject({
      "x-nkdk-schemaRefs": ["nkdk://schema/MetadataAttribute"],
    })
  })

  it("uses registered refs through property JSON Schema export", () => {
    registerJSONSchemaPropertyRef("MetadataAttributes", () => recordOfSchemaRef("MetadataAttribute"))

    const context = createJSONSchemaExportContext(baseContext, "externalRefs")
    expect(
      exportPropertyToJSONSchema({
        context,
        rule: { type: "MetadataAttributes" },
        value: undefined,
      })
    ).toEqual({
      type: "object",
      additionalProperties: { $ref: "nkdk://schema/MetadataAttribute" },
    })

    expect(attachCollectedSchemaRefs(context, Type.Object({}))).toMatchObject({
      "x-nkdk-schemaRefs": ["nkdk://schema/MetadataAttribute"],
    })
  })

  it("registers and lists named schema exporters", () => {
    const source = { itemType: "SampleItem" }
    registerJSONSchemaIdentity({
      name: "SampleItem",
      source,
      exporter: () => Type.Object({ Имя: Type.String() }),
    })

    expect(listJSONSchemaIdentityNames()).toEqual(["SampleItem"])
    expect(getJSONSchemaIdentityExporter("SampleItem")?.({ context: baseContext })).toMatchObject({
      type: "object",
      properties: { Имя: { type: "string" } },
    })
  })

  it("allows idempotent registration for the same source", () => {
    const source = { itemType: "SampleItem" }
    const exporter = () => Type.Object({})

    registerJSONSchemaIdentity({ name: "SampleItem", source, exporter })
    registerJSONSchemaIdentity({ name: "SampleItem", source, exporter })

    expect(listJSONSchemaIdentityNames()).toEqual(["SampleItem"])
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
