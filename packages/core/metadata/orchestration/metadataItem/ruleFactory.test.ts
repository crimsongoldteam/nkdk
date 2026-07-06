import { describe, expect, it } from "vitest"
import { getJSONSchemaIdentityExporter } from "../jsonSchemaRefs"
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

const ExplicitOnlySampleItemRule = {
  ...SampleItemRule,
  itemType: "ExplicitOnlySampleItem",
} as const satisfies MetadataItemRule

describe("registerMetadataItemRule JSON Schema identity", () => {
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
      propertyType: "ExplicitOnlySampleItemProperty",
      itemRule: ExplicitOnlySampleItemRule,
      schemaName: "ExplicitSampleItem",
    })

    expect(getJSONSchemaIdentityExporter("ExplicitOnlySampleItem")).toBeUndefined()
    expect(getJSONSchemaIdentityExporter("ExplicitSampleItem")?.({ context: baseContext })).toMatchObject({
      type: "object",
    })
  })
})
