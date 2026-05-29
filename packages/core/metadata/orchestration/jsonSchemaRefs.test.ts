import { Type } from "@sinclair/typebox"
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
})
