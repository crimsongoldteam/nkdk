import { Type } from "typebox"
import { describe, expect, it } from "vitest"

import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { createJSONSchemaExportContext, getJSONSchemaIdentityExporter } from "../jsonSchemaRefs"
import { exportPropertyToJSONSchema } from "../property/toJSONSchema"
import { PropertyRuleType } from "../property/registry"
import { getTypeRule } from "../property/typeRuleRegistry"
import type { MetadataItemRule, PropertyRule } from "../property/types"
import { registerMetadataItemCollectionRule } from "./ruleFactory"

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
})

describe("registerMetadataItemCollectionRule JSON Schema refs", () => {
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
