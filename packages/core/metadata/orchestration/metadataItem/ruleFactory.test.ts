import { describe, expect, it } from "vitest"
import { getJSONSchemaIdentityExporter } from "../jsonSchemaRefs"
import { getTypeRule } from "../property/typeRuleRegistry"
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

  it("describes filePath XML as an input of the owning import assignment", () => {
    registerMetadataItemRule({ propertyType: "RuleFactorySampleItemProperty", itemRule: SampleItemRule })

    expect(
      getTypeRule("RuleFactorySampleItemProperty", "xmlImportRoutes")?.({
        propertyRule: { type: "RuleFactorySampleItemProperty", filePath: "Ext/Sample.xml" },
      })
    ).toEqual([
      {
        kind: "assignment",
        xmlPattern: "Ext/Sample.xml",
        targetPattern: "",
        role: "properties",
        inputRole: "property",
        itemType: "",
        source: { kind: "propertyType", type: "RuleFactorySampleItemProperty" },
      },
    ])
  })
})
