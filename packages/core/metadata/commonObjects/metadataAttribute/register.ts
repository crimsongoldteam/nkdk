import { Type, type TSchema } from "@sinclair/typebox"
import { MetadataAttributeYAML, MetadataAttributes, MetadataAttributesXML, MetadataAttributesYAML } from "./types"
import { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { importMetadataItemFromYAML } from "~/metadata/orchestration/metadataItem/fromYAML"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "~/metadata/orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import {
  MetadataAttributeRules,
  MetadataAttributesWithAllowedTypesRules,
  MetadataCatalogAttributeRules,
  MetadataDocumentAttributeRules,
  MetadataTabularSectionAttributeRules,
} from "./rules"

type MetadataAttributeItemRule =
  | typeof MetadataAttributeRules
  | typeof MetadataAttributesWithAllowedTypesRules
  | typeof MetadataCatalogAttributeRules
  | typeof MetadataDocumentAttributeRules
  | typeof MetadataTabularSectionAttributeRules

type ExportMetadataAttributesToJSONSchemaFn = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: any | undefined
}) => TSchema

const importMetadataAttributeFromYAML = (
  context: ConfigurationContext,
  itemRule: MetadataAttributeItemRule,
  yaml: MetadataAttributeYAML,
  name: string
) => {
  const properties = importMetadataItemFromYAML({
    context,
    yaml,
    rule: itemRule,
    name,
  })

  if (properties == undefined) throw new Error("Properties are required")

  return {
    ...properties,
    name,
  }
}

const createImportMetadataAttributesFromYAML =
  (itemRule: MetadataAttributeItemRule) =>
  (
    context: ConfigurationContext,
    _rule: PropertyRule | undefined,
    data: MetadataAttributesYAML | undefined
  ): MetadataAttributes | undefined => {
    if (!data) return undefined

    const results = Object.entries(data).map(([name, value]) => {
      return importMetadataAttributeFromYAML(context, itemRule, value as MetadataAttributeYAML, name)
    })

    return results.length > 0 ? (results as MetadataAttributes) : undefined
  }

const createExportMetadataAttributesToJSONSchema =
  (itemRule: MetadataAttributeItemRule): ExportMetadataAttributesToJSONSchemaFn =>
  ({ context }) => {
    const attributeSchema = exportMetadataItemToJSONSchema({
      context,
      rule: itemRule,
    })

    return Type.Record(Type.String(), attributeSchema)
  }

export const exportMetadataAttributesToJSONSchema =
  createExportMetadataAttributesToJSONSchema(MetadataAttributeRules)

registerMetadataItemCollectionRule({
  propertyType: "MetadataCatalogAttributes",
  itemRule: MetadataCatalogAttributeRules,
  xmlElement: "Attribute",
  keyField: "name",
  fromYAML: createImportMetadataAttributesFromYAML(MetadataCatalogAttributeRules),
  toJSONSchema: createExportMetadataAttributesToJSONSchema(MetadataCatalogAttributeRules),
  collectionItemRule: true,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataAttributes",
  itemRule: MetadataAttributeRules,
  xmlElement: "Attribute",
  keyField: "name",
  fromYAML: createImportMetadataAttributesFromYAML(MetadataAttributeRules),
  toJSONSchema: exportMetadataAttributesToJSONSchema,
  collectionItemRule: true,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataAttributesWithAllowedTypes",
  itemRule: MetadataAttributesWithAllowedTypesRules,
  xmlElement: "Attribute",
  keyField: "name",
  fromYAML: createImportMetadataAttributesFromYAML(MetadataAttributesWithAllowedTypesRules),
  toJSONSchema: createExportMetadataAttributesToJSONSchema(MetadataAttributesWithAllowedTypesRules),
  collectionItemRule: true,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataTabularSectionAttributes",
  itemRule: MetadataTabularSectionAttributeRules,
  xmlElement: "Attribute",
  keyField: "name",
  fromYAML: createImportMetadataAttributesFromYAML(MetadataTabularSectionAttributeRules),
  toJSONSchema: createExportMetadataAttributesToJSONSchema(MetadataTabularSectionAttributeRules),
  collectionItemRule: true,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataDocumentAttributes",
  itemRule: MetadataDocumentAttributeRules,
  xmlElement: "Attribute",
  keyField: "name",
  fromYAML: createImportMetadataAttributesFromYAML(MetadataDocumentAttributeRules),
  toJSONSchema: createExportMetadataAttributesToJSONSchema(MetadataDocumentAttributeRules),
  collectionItemRule: true,
})

// Compat exports for consumers that call these functions directly
export const importMetadataAttributesFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: MetadataAttributesXML | undefined
): MetadataAttributes | undefined => {
  return importPropertyFromXML({ context, rule: { type: "MetadataAttributes" }, value: xml }) as
    | MetadataAttributes
    | undefined
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
