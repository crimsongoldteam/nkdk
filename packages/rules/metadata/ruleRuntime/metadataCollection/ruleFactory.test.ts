import { Type } from "typebox"
import { describe, expect, it } from "vitest"

import { compileValidationSchema } from "../../validation/compileValidationSchema"
import {
  createJSONSchemaExportContext,
} from "../jsonSchemaRefs"
import { exportPropertyToJSONSchema } from "../property/toJSONSchema"
import { PropertyRuleType } from "../property/registry"
import type { MetadataItemRule, PropertyRule } from "../property/types"
import { defineMetadataItemCollectionRule } from "./ruleFactory"
import { composeMetadataRules, defineMetadataRules, type MetadataRulesDefinition } from "../definition"
import { emptyMetadataRules } from "../definition/testSupport"
import { createRuleRegistrySet, type RuleRegistrySet } from "../ruleRegistrySet"

const itemRule = {
  itemType: "TestCollectionItem",
  properties: {
    name: { type: "string", xml: "Name", yaml: "name", required: true },
    value: { type: "string", xml: "Value", yaml: "value" },
  },
} as MetadataItemRule

const recursiveItemRule = {
  itemType: "TestRecursiveArrayItem",
  properties: {
    name: { type: "string", yaml: "name" },
    children: { type: "TestRecursiveSchemaCollection" as PropertyRuleType, yaml: "children" },
  },
} as MetadataItemRule

const recordType = "TestRecordSchemaCollection" as PropertyRuleType
const arrayType = "TestArraySchemaCollection" as PropertyRuleType
const recursiveType = "TestRecursiveSchemaCollection" as PropertyRuleType

const collectionRules = createCollectionRegistry(
  defineMetadataItemCollectionRule({ propertyType: recordType, itemRule, xmlElement: "Item", keyField: "name" }),
  defineMetadataItemCollectionRule({ propertyType: arrayType, itemRule, xmlElement: "Item", yamlAsArray: true }),
  defineMetadataItemCollectionRule({
  propertyType: recursiveType,
  itemRule: recursiveItemRule,
  xmlElement: "Item",
  yamlAsArray: true,
  }),
)

const context = { languages: { default: "ru", registered: ["ru"], registeredSet: new Set(["ru"]), version: '["ru",["ru"]]' }, version: "2.20" } as const
const propertyRule = (type: PropertyRuleType): PropertyRule => ({ type })
const exportCollectionPropertySchema = (
  rules: RuleRegistrySet,
  propertyType: PropertyRuleType,
) => exportPropertyToJSONSchema({
  context: contextFor(rules, "externalRefs"),
  rule: propertyRule(propertyType),
  value: undefined,
  execution: rules.execution,
})

describe("registerMetadataItemCollectionRule direct importer", () => {
  it("creates a definition without writing to legacy registries", () => {
    const propertyType = "TestPureCollection" as PropertyRuleType
    const definition = defineMetadataItemCollectionRule({
      propertyType,
      itemRule,
      xmlElement: "Item",
    })

    expect(definition.propertyTypes[propertyType]?.importFromXMLToYAML).toBeTypeOf(
      "function",
    )
    expect(definition.schemaPropertyRefs[propertyType]).toBeTypeOf("function")
    expect(definition.schemas[itemRule.itemType]?.source).toBe(itemRule)
  })

  it("registers an explicitly opted-in direct importer", () => {
    const propertyType = "TestCustomDirectCollection" as PropertyRuleType
    const fromXMLToYAML = () => ({ Значение: "direct" })
    const rules = createCollectionRegistry(defineMetadataItemCollectionRule({
      propertyType,
      itemRule,
      xmlElement: "Item",
      fromXMLToYAML,
    }))

    expect(rules.property.getTypeRule(propertyType, "importFromXMLToYAML")).toBe(fromXMLToYAML)
  })

  it("передаёт propertyRule в отображение внутреннего имени на YAML-ключ", () => {
    const propertyType = "TestCanonicalNameCollection" as PropertyRuleType
    const rules = createCollectionRegistry(defineMetadataItemCollectionRule({
      propertyType,
      itemRule,
      xmlElement: "Item",
      keyField: "name",
      completeItemNames: () => ["ExchangeDate"],
      recordYamlKeyFromYAML: ({ name, propertyRule }) =>
        (propertyRule as PropertyRule & { names: Record<string, string> }).names[name] ?? name,
    }))
    const descriptor = rules.property.getTypeRule(propertyType, "yamlToXMLNestedRule")

    expect(descriptor).toMatchObject({
      kind: "collection",
      recordYamlKeyFromYAML: expect.any(Function),
    })
    if (descriptor?.kind !== "collection" || descriptor.recordYamlKeyFromYAML === undefined) {
      throw new Error("Не передано отображение имени коллекции")
    }
    expect(descriptor.recordYamlKeyFromYAML({
      yaml: {},
      name: "ExchangeDate",
      propertyRule: { type: propertyType, names: { ExchangeDate: "ДатаОбмена" } } as never,
    })).toBe("ДатаОбмена")
  })
})

describe("registerMetadataItemCollectionRule default toJSONSchema", () => {
  it("exports record schema for record YAML collections", () => {
    const schema = exportPropertyToJSONSchema({
      context,
      rule: propertyRule(recordType),
      value: undefined,
      execution: collectionRules.execution,
    })
    const compiled = compileValidationSchema(schema!)

    expect(compiled.Check({ A: { name: "A" } })).toBe(true)
    expect(compiled.Check({ A: undefined })).toBe(false)
    expect(compiled.Check([{ name: "A" }])).toBe(false)
  })

  it("exports array schema for yamlAsArray collections", () => {
    const schema = exportPropertyToJSONSchema({
      context,
      rule: propertyRule(arrayType),
      value: undefined,
      execution: collectionRules.execution,
    })
    const compiled = compileValidationSchema(schema!)

    expect(compiled.Check([{ name: "A" }])).toBe(true)
    expect(compiled.Check({ A: { name: "A" } })).toBe(false)
  })

  it("exports array schema inside recursive yamlAsArray collections", () => {
    const schema = exportPropertyToJSONSchema({
      context,
      rule: propertyRule(recursiveType),
      value: undefined,
      execution: collectionRules.execution,
    })
    const compiled = compileValidationSchema(schema!)

    expect(compiled.Check([{ name: "A", children: [] }])).toBe(true)
    expect(compiled.Check([{ name: "A", children: { B: {} } }])).toBe(false)
  })

  it.each(["inline", "externalRefs"] as const)(
    "uses explicit itemRule in %s JSON Schema",
    (mode) => {
      const propertyType = `TestExplicitItemRule${mode}` as PropertyRuleType
      const fallbackRule = {
        itemType: `TestFallbackItem${mode}`,
        properties: {
          fallback: { type: "string", yaml: "fallback", required: true },
        },
      } as MetadataItemRule
      const explicitRule = {
        itemType: `TestExplicitItem${mode}`,
        properties: {
          explicit: { type: "string", yaml: "explicit", required: true },
        },
      } as MetadataItemRule
      const rules = createCollectionRegistry(defineMetadataItemCollectionRule({
        propertyType,
        itemRule: fallbackRule,
        xmlElement: "Item",
      }))
      const schemaContext = contextFor(rules, mode)
      const schema = exportPropertyToJSONSchema({
        context: schemaContext,
        rule: { type: propertyType, itemRule: explicitRule },
        value: undefined,
        execution: rules.execution,
      })!
      const compiled = compileValidationSchema(schema)

      expect(compiled.Check({ A: { explicit: "yes" } })).toBe(true)
      expect(compiled.Check({ A: { fallback: "no" } })).toBe(false)
    }
  )
})

describe("registerMetadataItemCollectionRule JSON Schema refs", () => {
  it("resolves a named owner schema from a later itemRule declaration", () => {
    const propertyType = "TestDeclaredOwnerCollection" as PropertyRuleType
    const fallbackRule = {
      itemType: "TestDeclaredFallbackItem",
      properties: { fallback: { type: "string", yaml: "fallback" } },
    } as MetadataItemRule
    const ownerRule = {
      itemType: "TestDeclaredOwnerItem",
      properties: { owner: { type: "string", yaml: "owner", required: true } },
    } as MetadataItemRule

    const collectionDefinition = defineMetadataItemCollectionRule({
      propertyType,
      schemaName: "TestDeclaredOwnerSchema",
      itemRule: fallbackRule,
      xmlElement: "Item",
    })
    const rules = createCollectionRegistry(
      collectionDefinition,
      defineMetadataRules({
        ...emptyMetadataRules,
        propertyItemRules: { [propertyType]: ownerRule },
      }),
    )

    const schemaContext = contextFor(rules, "externalRefs")
    expect(
      exportPropertyToJSONSchema({
        context: schemaContext,
        rule: { type: propertyType, itemRule: ownerRule },
        value: undefined,
        execution: rules.execution,
      })
    ).toEqual({ type: "object", additionalProperties: { $ref: "nkdk://schema/TestDeclaredOwnerSchema" } })

    const namedSchema = rules.schemas.get("TestDeclaredOwnerSchema")?.export({
      context: schemaContext,
      execution: rules.execution,
    })
    const compiled = compileValidationSchema(namedSchema!)
    expect(compiled.Check({ owner: "yes" })).toBe(true)
    expect(compiled.Check({ fallback: "no" })).toBe(false)
  })

  it("registers record ref schema for metadata collections by default", () => {
    const propertyType = "TestRefCollection" as PropertyRuleType
    const rules = createCollectionRegistry(defineMetadataItemCollectionRule({ propertyType, itemRule, xmlElement: "Item" }))

    expect(exportCollectionPropertySchema(rules, propertyType)).toEqual({
      type: "object",
      additionalProperties: { $ref: "nkdk://schema/TestCollectionItem" },
    })
  })

  it("registers array ref schema when yamlAsArray is true", () => {
    const propertyType = "TestRefArrayCollection" as PropertyRuleType
    const rules = createCollectionRegistry(defineMetadataItemCollectionRule({
      propertyType,
      itemRule,
      xmlElement: "Item",
      yamlAsArray: true,
    }))

    expect(exportCollectionPropertySchema(rules, propertyType)).toEqual({
      type: "array",
      items: { $ref: "nkdk://schema/TestCollectionItem" },
    })
  })

  it("uses explicit schemaName for collection item refs", () => {
    const propertyType = "TestExplicitRefCollection" as PropertyRuleType
    const rules = createCollectionRegistry(defineMetadataItemCollectionRule({
      propertyType,
      itemRule,
      xmlElement: "Item",
      schemaName: "ExplicitCollectionItem",
    }))

    expect(exportCollectionPropertySchema(rules, propertyType)).toEqual({
      type: "object",
      additionalProperties: { $ref: "nkdk://schema/ExplicitCollectionItem" },
    })
  })

  it("registers direct schema ref for custom collection schemas", () => {
    const propertyType = "TestCustomSchemaCollection" as PropertyRuleType
    const rules = createCollectionRegistry(defineMetadataItemCollectionRule({
      propertyType,
      itemRule,
      xmlElement: "Item",
      schemaName: "CustomCollectionSchema",
      schemaShape: "schema",
      toJSONSchema: () => Type.Array(Type.Object({ custom: Type.Literal("yes") }, { additionalProperties: false })),
    }))

    const schema = exportPropertyToJSONSchema({
      context: contextFor(rules, "externalRefs"),
      rule: propertyRule(propertyType),
      value: undefined,
      execution: rules.execution,
    })
    const identityExporter = rules.schemas.get("CustomCollectionSchema")?.export

    expect(schema).toEqual({ $ref: "nkdk://schema/CustomCollectionSchema" })
    expect(identityExporter?.({ context, execution: rules.execution })).toMatchObject({
      type: "array",
      items: { type: "object", properties: { custom: { const: "yes" } } },
    })
  })
})

function contextFor(rules: RuleRegistrySet, mode: "inline" | "externalRefs") {
  return createJSONSchemaExportContext(context, mode, {
    propertyRef: ({ context: schemaContext, rule }) => rules.schemas.propertyRef((rule as PropertyRule).type)?.({
      context: schemaContext,
      rule: rule as PropertyRule,
      execution: rules.execution,
    }),
  })
}

function createCollectionRegistry(...definitions: readonly MetadataRulesDefinition<never>[]) {
  return createRuleRegistrySet(composeMetadataRules(
    defineMetadataRules({
      ...emptyMetadataRules,
      propertyTypes: { string: { exportToJSONSchema: () => Type.String() } },
    }),
    ...definitions,
  ))
}
