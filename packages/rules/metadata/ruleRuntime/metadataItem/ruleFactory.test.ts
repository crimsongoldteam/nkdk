import { describe, expect, it } from "vitest"
import { createJSONSchemaExportContext, getJSONSchemaIdentityExporter } from "../jsonSchemaRefs"
import { exportPropertyToJSONSchema } from "../property/toJSONSchema"
import { getTypeRule } from "../property/typeRuleRegistry"
import type { MetadataItemRule } from "../property/types"
import {
  defineMetadataItemRule,
  registerMetadataItemRule,
} from "./ruleFactory"
import { typeRulesRegistryRevision } from "../property/typeRuleRegistry"
import { listJSONSchemaIdentityNames } from "../jsonSchemaRefs"
import { predefinedRule } from "../../commonObjects/predefined/builders"
import { PredefinedRules } from "../../commonObjects/predefined/rules"
import { ChartOfAccountsPredefinedRules } from "../../appliedObjects/metadataChartOfAccounts/predefined/rules"
import { ChartOfCalculationTypesPredefinedRules } from "../../appliedObjects/metadataChartOfCalculationTypes/predefinedRules"
import "../../commonObjects/predefined"

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
  it("creates a definition without writing to legacy registries", () => {
    const typeRevision = typeRulesRegistryRevision()
    const schemaNames = listJSONSchemaIdentityNames()

    const definition = defineMetadataItemRule({
      propertyType: "RuleFactorySampleItemProperty",
      itemRule: SampleItemRule,
    })

    expect(typeRulesRegistryRevision()).toBe(typeRevision)
    expect(listJSONSchemaIdentityNames()).toEqual(schemaNames)
    expect(
      definition.propertyTypes.RuleFactorySampleItemProperty
        ?.importFromXMLToYAML,
    ).toBeTypeOf("function")
    expect(definition.metadataItems[SampleItemRule.itemType]).toBe(
      SampleItemRule,
    )
    expect(definition.schemas[SampleItemRule.itemType]?.source).toBe(
      SampleItemRule,
    )
  })

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
      getTypeRule("RuleFactorySampleItemProperty", "resourceTopology")?.({
        propertyRule: { type: "RuleFactorySampleItemProperty", filePath: "Ext/Sample.xml" },
      })
    ).toEqual([
      {
        kind: "xmlDocument",
        assignmentProjectPattern: "",
        xmlPattern: "Ext/Sample.xml",
        role: "property",
        required: false,
        read: { inputRole: "property" },
        prepareCapabilityId: "itemProperty",
        source: { kind: "property", description: "RuleFactorySampleItemProperty" },
      },
    ])
  })

  it("позволяет property-rule уточнить правило вложенного документа", () => {
    registerMetadataItemRule({ propertyType: "RuleFactorySampleItemProperty", itemRule: SampleItemRule })
    const override = {
      ...SampleItemRule,
      itemType: "RuleFactoryOverriddenSampleItem",
    } as const satisfies MetadataItemRule
    const descriptor = getTypeRule("RuleFactorySampleItemProperty", "yamlToXMLNestedRule")

    expect(
      descriptor?.kind === "item"
        ? descriptor.itemRuleFromProperty?.({
            type: "RuleFactorySampleItemProperty",
            itemRule: override,
          })
        : undefined
    ).toBe(override)
  })

  it("restores full required inside a non-addressable nested item", () => {
    registerMetadataItemRule({ propertyType: "RuleFactorySampleItemProperty", itemRule: SampleItemRule })
    const context = createJSONSchemaExportContext(baseContext, "inline")
    context.exportToJSONSchema!.requiredPolicy = {
      currentBoundary: "defer",
      cacheVariant: "extension-overlay",
    }

    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "RuleFactorySampleItemProperty" },
      value: undefined,
    })

    expect(schema).toMatchObject({ required: ["Имя"] })
  })

  it("starts a new deferred boundary for an addressable nested item", () => {
    const addressableRule = {
      ...SampleItemRule,
      itemType: "RuleFactoryAddressableSampleItem",
      externalMetadata: { segment: "Sample", placement: "ownerChild" },
    } as const satisfies MetadataItemRule
    registerMetadataItemRule({
      propertyType: "RuleFactoryAddressableSampleItemProperty",
      itemRule: addressableRule,
    })
    const context = createJSONSchemaExportContext(baseContext, "inline")
    context.exportToJSONSchema!.requiredPolicy = {
      currentBoundary: "full",
      cacheVariant: "full",
    }

    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "RuleFactoryAddressableSampleItemProperty" },
      value: undefined,
    })

    expect(schema).not.toHaveProperty("required")
    expect(schema).toHaveProperty("properties.Имя")
  })
})

describe("Predefined JSON Schema", () => {
  const schemaContext = createJSONSchemaExportContext(baseContext, "externalRefs")

  it.each([
    [ChartOfAccountsPredefinedRules, ["Порядок", "ПризнакиУчета"]],
    [
      ChartOfCalculationTypesPredefinedRules,
      ["ПериодДействияБазовый", "Базовые", "Ведущие", "Вытесняющие"],
    ],
  ] as const)("uses the specialized Predefined itemRule", (itemRule, fields) => {
    const properties = recordValueProperties(
      exportPropertyToJSONSchema({
        context: schemaContext,
        rule: predefinedRule({ itemRule }),
        value: undefined,
      })!,
    )

    for (const field of fields) expect(properties).toHaveProperty(field)
  })

  it("does not add specialized fields to base Predefined", () => {
    const properties = recordValueProperties(
      exportPropertyToJSONSchema({
        context: baseContext,
        rule: predefinedRule({ itemRule: PredefinedRules }),
        value: undefined,
      })!,
    )

    expect(properties).not.toHaveProperty("Порядок")
    expect(properties).not.toHaveProperty("ПериодДействияБазовый")
  })
})

function recordValueProperties(schema: unknown): Record<string, unknown> {
  const patternProperties = isRecord(schema) && isRecord(schema.patternProperties)
    ? schema.patternProperties
    : undefined
  const valueSchema = patternProperties === undefined ? undefined : Object.values(patternProperties)[0]
  if (!isRecord(valueSchema)) throw new Error("JSON Schema Predefined не содержит схему элемента")
  if (isRecord(valueSchema.properties)) return valueSchema.properties

  const definition =
    typeof valueSchema.$ref === "string" && isRecord(valueSchema.$defs)
      ? valueSchema.$defs[valueSchema.$ref]
      : undefined
  if (!isRecord(definition) || !isRecord(definition.properties)) {
    throw new Error("JSON Schema Predefined не содержит свойства элемента")
  }
  return definition.properties
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
