import { describe, expect, it } from "vitest"
import { getJSONSchemaIdentityExporter } from "../jsonSchemaRefs"
import type { MetadataItemRule } from "../property/types"
import { registerMetadataItemRule } from "./ruleFactory"

const baseContext = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

const SampleItemRule = {
  itemType: "RuleFactorySampleItem",
  properties: {
    name: { yaml: "Имя", type: "string", required: true },
  },
} as const satisfies MetadataItemRule

const ExplicitOnlySampleItemRule = {
  ...SampleItemRule,
  itemType: "RuleFactoryExplicitOnlySampleItem",
} as const satisfies MetadataItemRule

describe("registerMetadataItemRule JSON Schema identity", () => {
  it("registers item schema by itemType by default", () => {
    registerMetadataItemRule({ propertyType: "RuleFactorySampleItemProperty", itemRule: SampleItemRule })

    const exporter = getJSONSchemaIdentityExporter("RuleFactorySampleItem")
    expect(exporter?.({ context: baseContext })).toMatchObject({
      type: "object",
      properties: { Имя: { type: "string" } },
      required: ["Имя"],
    })
  })

  it("uses explicit schemaName when provided", () => {
    registerMetadataItemRule({
      propertyType: "RuleFactoryExplicitOnlySampleItemProperty",
      itemRule: ExplicitOnlySampleItemRule,
      schemaName: "RuleFactoryExplicitSampleItem",
    })

    expect(getJSONSchemaIdentityExporter("RuleFactoryExplicitOnlySampleItem")).toBeUndefined()
    expect(getJSONSchemaIdentityExporter("RuleFactoryExplicitSampleItem")?.({ context: baseContext })).toMatchObject({
      type: "object",
    })
  })
})
