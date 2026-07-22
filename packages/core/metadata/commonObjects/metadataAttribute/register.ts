import { Type, type TSchema } from "typebox"
import type { MetadataAttributes, MetadataAttributesXML, MetadataAttributesYAML } from "./types"
import { ConfigurationContext, ConfigurationContextFromXML } from "../../context/types"
import { exportMetadataItemToJSONSchema } from "../../orchestration/metadataItem/toJSONSchema"
import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "../../orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "../../orchestration/property/fromXML"
import type { PropertyRule } from "../../orchestration/property/types"
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

const createExportMetadataAttributesToJSONSchema =
  (itemRule: MetadataAttributeItemRule): ExportMetadataAttributesToJSONSchemaFn =>
  ({ context }) => {
    const attributeSchema = exportMetadataItemToJSONSchema({
      context,
      rule: itemRule,
    })

    return Type.Record(Type.String(), attributeSchema)
  }

export const exportMetadataAttributesToJSONSchema = createExportMetadataAttributesToJSONSchema(MetadataAttributeRules)

registerMetadataItemCollectionRule({
  propertyType: "MetadataCatalogAttributes",
  itemRule: MetadataCatalogAttributeRules,
  schemaName: "MetadataCatalogAttribute",
  xmlElement: "Attribute",
  keyField: "name",
  toJSONSchema: createExportMetadataAttributesToJSONSchema(MetadataCatalogAttributeRules),
  collectionItemRule: true,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataAttributes",
  itemRule: MetadataAttributeRules,
  schemaName: "MetadataAttribute",
  xmlElement: "Attribute",
  keyField: "name",
  toJSONSchema: exportMetadataAttributesToJSONSchema,
  collectionItemRule: true,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataAttributesWithAllowedTypes",
  itemRule: MetadataAttributesWithAllowedTypesRules,
  schemaName: "MetadataAttributesWithAllowedTypes",
  xmlElement: "Attribute",
  keyField: "name",
  toJSONSchema: createExportMetadataAttributesToJSONSchema(MetadataAttributesWithAllowedTypesRules),
  collectionItemRule: true,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataTabularSectionAttributes",
  itemRule: MetadataTabularSectionAttributeRules,
  schemaName: "MetadataTabularSectionAttribute",
  xmlElement: "Attribute",
  keyField: "name",
  toJSONSchema: createExportMetadataAttributesToJSONSchema(MetadataTabularSectionAttributeRules),
  collectionItemRule: true,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataDocumentAttributes",
  itemRule: MetadataDocumentAttributeRules,
  schemaName: "MetadataDocumentAttribute",
  xmlElement: "Attribute",
  keyField: "name",
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
