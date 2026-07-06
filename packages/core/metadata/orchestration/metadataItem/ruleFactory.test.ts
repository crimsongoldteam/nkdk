import { describe, expect, it, beforeEach } from "vitest"
import { clearJSONSchemaRefRegistries, getJSONSchemaIdentityExporter } from "../jsonSchemaRefs"
import type { MetadataItemRule } from "../property/types"
import { registerMetadataItemRule } from "./ruleFactory"

const baseContext = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

const SampleItemRule = {
  itemType: "SampleItem",
  properties: {
    name: { yaml: "Имя", type: "string", required: true },
  },
} as const satisfies MetadataItemRule

describe("registerMetadataItemRule JSON Schema identity", () => {
  beforeEach(() => {
    clearJSONSchemaRefRegistries()
  })

  it("registers item schema by itemType by default", () => {
    registerMetadataItemRule({ propertyType: "SampleItemProperty", itemRule: SampleItemRule })

    const exporter = getJSONSchemaIdentityExporter("SampleItem")
    expect(exporter?.({ context: baseContext })).toMatchObject({
      type: "object",
      properties: { Имя: { type: "string" } },
      required: ["Имя"],
    })
  })

  it("uses explicit schemaName when provided", () => {
    registerMetadataItemRule({
      propertyType: "SampleItemProperty",
      itemRule: SampleItemRule,
      schemaName: "ExplicitSampleItem",
    })

    expect(getJSONSchemaIdentityExporter("SampleItem")).toBeUndefined()
    expect(getJSONSchemaIdentityExporter("ExplicitSampleItem")?.({ context: baseContext })).toMatchObject({
      type: "object",
    })
  })
})
