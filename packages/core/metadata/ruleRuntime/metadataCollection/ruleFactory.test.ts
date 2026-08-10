import { Type } from "typebox"
import { describe, expect, it } from "vitest"

import { compileValidationSchema } from "../../validation/compileValidationSchema"
import {
  createJSONSchemaExportContext,
  createSchemaRef,
  getJSONSchemaIdentityExporter,
  listJSONSchemaIdentityNames,
} from "../jsonSchemaRefs"
import { exportPropertyToJSONSchema } from "../property/toJSONSchema"
import { PropertyRuleType } from "../property/registry"
import { declarePropertyItemRule } from "../property/propertyItemRuleDeclarations"
import {
  getTypeRule,
  typeRulesRegistryRevision,
} from "../property/typeRuleRegistry"
import type { MetadataItemRule, PropertyRule } from "../property/types"
import {
  defineMetadataItemCollectionRule,
  registerMetadataItemCollectionRule,
} from "./ruleFactory"

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

registerMetadataItemCollectionRule({ propertyType: recordType, itemRule, xmlElement: "Item", keyField: "name" })
registerMetadataItemCollectionRule({ propertyType: arrayType, itemRule, xmlElement: "Item", yamlAsArray: true })
registerMetadataItemCollectionRule({
  propertyType: recursiveType,
  itemRule: recursiveItemRule,
  xmlElement: "Item",
  yamlAsArray: true,
})

const context = { defaultLanguage: "ru", version: "2.20" } as const
const propertyRule = (type: PropertyRuleType): PropertyRule => ({ type })

describe("registerMetadataItemCollectionRule direct importer", () => {
  it("creates a definition without writing to legacy registries", () => {
    const propertyType = "TestPureCollection" as PropertyRuleType
    const typeRevision = typeRulesRegistryRevision()
    const schemaNames = listJSONSchemaIdentityNames()

    const definition = defineMetadataItemCollectionRule({
      propertyType,
      itemRule,
      xmlElement: "Item",
    })

    expect(typeRulesRegistryRevision()).toBe(typeRevision)
    expect(listJSONSchemaIdentityNames()).toEqual(schemaNames)
    expect(definition.propertyTypes[propertyType]?.importFromXMLToYAML).toBeTypeOf(
      "function",
    )
    expect(definition.schemaPropertyRefs[propertyType]).toBeTypeOf("function")
    expect(definition.schemas[itemRule.itemType]?.source).toBe(itemRule)
  })

  it("registers an explicitly opted-in direct importer", () => {
    const propertyType = "TestCustomDirectCollection" as PropertyRuleType
    const fromXMLToYAML = () => ({ Значение: "direct" })
    registerMetadataItemCollectionRule({ propertyType, itemRule, xmlElement: "Item", fromXMLToYAML })

    expect(getTypeRule(propertyType, "importFromXMLToYAML")).toBe(fromXMLToYAML)
  })
})

describe("registerMetadataItemCollectionRule default toJSONSchema", () => {
  it("exports record schema for record YAML collections", () => {
    const schema = exportPropertyToJSONSchema({ context, rule: propertyRule(recordType), value: undefined })
    const compiled = compileValidationSchema(schema!)

    expect(compiled.Check({ A: { name: "A" } })).toBe(true)
    expect(compiled.Check({ A: undefined })).toBe(false)
    expect(compiled.Check([{ name: "A" }])).toBe(false)
  })

  it("exports array schema for yamlAsArray collections", () => {
    const schema = exportPropertyToJSONSchema({ context, rule: propertyRule(arrayType), value: undefined })
    const compiled = compileValidationSchema(schema!)

    expect(compiled.Check([{ name: "A" }])).toBe(true)
    expect(compiled.Check({ A: { name: "A" } })).toBe(false)
  })

  it("exports array schema inside recursive yamlAsArray collections", () => {
    const schema = exportPropertyToJSONSchema({ context, rule: propertyRule(recursiveType), value: undefined })
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
      registerMetadataItemCollectionRule({ propertyType, itemRule: fallbackRule, xmlElement: "Item" })
      const schemaContext = createJSONSchemaExportContext(context, mode)
      const schema = exportPropertyToJSONSchema({
        context: schemaContext,
        rule: { type: propertyType, itemRule: explicitRule },
        value: undefined,
      })!
      const fallbackSchema = getJSONSchemaIdentityExporter(fallbackRule.itemType)?.({ context: schemaContext })
      const compiled =
        fallbackSchema === undefined
          ? compileValidationSchema(schema)
          : compileValidationSchema({ [createSchemaRef(fallbackRule.itemType)]: fallbackSchema }, schema)

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

    registerMetadataItemCollectionRule({
      propertyType,
      schemaName: "TestDeclaredOwnerSchema",
      itemRule: fallbackRule,
      xmlElement: "Item",
    })
    declarePropertyItemRule(propertyType, ownerRule)

    const schemaContext = createJSONSchemaExportContext(context, "externalRefs")
    expect(
      exportPropertyToJSONSchema({
        context: schemaContext,
        rule: { type: propertyType, itemRule: ownerRule },
        value: undefined,
      })
    ).toEqual({ type: "object", additionalProperties: { $ref: "nkdk://schema/TestDeclaredOwnerSchema" } })

    const namedSchema = getJSONSchemaIdentityExporter("TestDeclaredOwnerSchema")?.({ context: schemaContext })
    const compiled = compileValidationSchema(namedSchema!)
    expect(compiled.Check({ owner: "yes" })).toBe(true)
    expect(compiled.Check({ fallback: "no" })).toBe(false)
  })

  it("registers record ref schema for metadata collections by default", () => {
    const propertyType = "TestRefCollection" as PropertyRuleType
    registerMetadataItemCollectionRule({ propertyType, itemRule, xmlElement: "Item" })

    expect(
      exportPropertyToJSONSchema({
        context: createJSONSchemaExportContext(context, "externalRefs"),
        rule: propertyRule(propertyType),
        value: undefined,
      })
    ).toEqual({ type: "object", additionalProperties: { $ref: "nkdk://schema/TestCollectionItem" } })
  })

  it("registers array ref schema when yamlAsArray is true", () => {
    const propertyType = "TestRefArrayCollection" as PropertyRuleType
    registerMetadataItemCollectionRule({ propertyType, itemRule, xmlElement: "Item", yamlAsArray: true })

    expect(
      exportPropertyToJSONSchema({
        context: createJSONSchemaExportContext(context, "externalRefs"),
        rule: propertyRule(propertyType),
        value: undefined,
      })
    ).toEqual({ type: "array", items: { $ref: "nkdk://schema/TestCollectionItem" } })
  })

  it("uses explicit schemaName for collection item refs", () => {
    const propertyType = "TestExplicitRefCollection" as PropertyRuleType
    registerMetadataItemCollectionRule({
      propertyType,
      itemRule,
      xmlElement: "Item",
      schemaName: "ExplicitCollectionItem",
    })

    expect(
      exportPropertyToJSONSchema({
        context: createJSONSchemaExportContext(context, "externalRefs"),
        rule: propertyRule(propertyType),
        value: undefined,
      })
    ).toEqual({ type: "object", additionalProperties: { $ref: "nkdk://schema/ExplicitCollectionItem" } })
  })

  it("registers direct schema ref for custom collection schemas", () => {
    const propertyType = "TestCustomSchemaCollection" as PropertyRuleType
    registerMetadataItemCollectionRule({
      propertyType,
      itemRule,
      xmlElement: "Item",
      schemaName: "CustomCollectionSchema",
      schemaShape: "schema",
      toJSONSchema: () => Type.Array(Type.Object({ custom: Type.Literal("yes") }, { additionalProperties: false })),
    })

    const schema = exportPropertyToJSONSchema({
      context: createJSONSchemaExportContext(context, "externalRefs"),
      rule: propertyRule(propertyType),
      value: undefined,
    })
    const identityExporter = getJSONSchemaIdentityExporter("CustomCollectionSchema")

    expect(schema).toEqual({ $ref: "nkdk://schema/CustomCollectionSchema" })
    expect(identityExporter?.({ context })).toMatchObject({
      type: "array",
      items: { type: "object", properties: { custom: { const: "yes" } } },
    })
  })
})
