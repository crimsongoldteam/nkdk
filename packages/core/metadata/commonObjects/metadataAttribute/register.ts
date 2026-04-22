import { TSchema, Type } from "@sinclair/typebox"
import {
  MetadataAttributeYAML,
  MetadataAttributes,
  MetadataAttributesXML,
  MetadataAttributesYAML,
} from "./types"
import { importTypeDescriptionFromYAML } from "~/metadata/commonObjects/typeDescription/fromYAML"
import "~/metadata/commonObjects/typeDescription/graphFromModel"
import { TypeDescriptionYAML } from "~/metadata/commonObjects/typeDescription/types"
import { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { splitPascalCase } from "~/metadata/helpers/canConvertToPascalCase"
import { ExportToJSONSchemaFn, importMetadataItemFromYAML, registerTypeRule } from "~/metadata/orchestration"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "~/metadata/orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { MetadataAttributeRules, MetadataTabularSectionAttributeRules } from "./rules"

const importMetadataAttributeFromYAML = (
  context: ConfigurationContext,
  yaml: MetadataAttributeYAML | TypeDescriptionYAML,
  name: string
) => {
  if (typeof yaml === "string" || Array.isArray(yaml)) {
    const type = importTypeDescriptionFromYAML(context, undefined, yaml)
    if (!type) throw new Error("Type is required")

    return {
      itemType: MetadataAttributeRules.itemType,
      name,
      type,
      synonym: { items: { [context.defaultLanguage]: splitPascalCase(name) } },
    }
  }

  const properties = importMetadataItemFromYAML({
    context,
    yaml: yaml as MetadataAttributeYAML,
    rule: MetadataAttributeRules,
    name,
  })

  if (properties == undefined) throw new Error("Properties are required")

  return {
    ...properties,
    name,
  }
}

const importMetadataAttributesFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataAttributesYAML | undefined
): MetadataAttributes | undefined => {
  if (!data) return undefined

  const results = Object.entries(data).map(([name, value]) => {
    return importMetadataAttributeFromYAML(context, value as MetadataAttributeYAML, name)
  })

  return results.length > 0 ? (results as MetadataAttributes) : undefined
}

registerMetadataItemCollectionRule({
  propertyType: "MetadataAttributes",
  itemRule: MetadataAttributeRules,
  xmlElement: "Attribute",
  keyField: "name",
  fromYAML: importMetadataAttributesFromYAML,
  graphChild: { idFrom: "name", edgeName: "Реквизит" },
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataTabularSectionAttributes",
  itemRule: MetadataTabularSectionAttributeRules,
  xmlElement: "Attribute",
  keyField: "name",
  fromYAML: importMetadataAttributesFromYAML,
  graphChild: { idFrom: "name", edgeName: "Реквизит" },
})

const exportMetadataAttributesToJSONSchema: ExportToJSONSchemaFn = (params: {
  context: ConfigurationContext
}): TSchema => {
  const { context } = params
  const attributeSchema = exportMetadataItemToJSONSchema({
    context: context,
    rule: MetadataAttributeRules,
  })
  return Type.Record(Type.String(), attributeSchema)
}

registerTypeRule("MetadataAttributes", "exportToJSONSchema", exportMetadataAttributesToJSONSchema)

// Compat exports for consumers that call these functions directly
export const importMetadataAttributesFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: MetadataAttributesXML | undefined
): MetadataAttributes | undefined => {
  return importPropertyFromXML({ context, rule: { type: "MetadataAttributes" }, value: xml }) as MetadataAttributes | undefined
}

export const exportMetadataAttributesToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataAttributes | undefined
): MetadataAttributesYAML | undefined => {
  return exportMetadataCollectionToYAMLAsRecord({
    context,
    data,
    itemRule: MetadataAttributeRules,
    keyField: "name",
  }) as MetadataAttributesYAML | undefined
}
