import { Type } from "typebox"
import { afterEach, describe, expect, it } from "vitest"
import {
  attachCollectedSchemaRefs,
  clearJSONSchemaRefRegistries,
  createJSONSchemaExportContext,
  createSchemaRef,
  exportPropertyExternalRefSchema,
  recordOfSchemaRef,
  registerJSONSchemaPropertyRef,
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
})
