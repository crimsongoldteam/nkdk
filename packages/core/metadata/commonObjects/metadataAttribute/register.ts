import { TSchema, Type } from "@sinclair/typebox"
import { MetadataAttributeYAML, MetadataAttributes, MetadataAttributesXML, MetadataAttributesYAML } from "./types"
import { importTypeDescriptionFromYAML } from "~/metadata/commonObjects/typeDescription/fromYAML"
import "~/metadata/commonObjects/typeDescription/graphFromModel"
import { TypeDescriptionYAML } from "~/metadata/commonObjects/typeDescription/types"
import { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { splitPascalCase } from "~/metadata/helpers/canConvertToPascalCase"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { importMetadataItemFromYAML } from "~/metadata/orchestration/metadataItem/fromYAML"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "~/metadata/orchestration/metadataCollection/toYAML"
import { ExportToJSONSchemaFn } from "~/metadata/orchestration/property/fn"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import {
  MetadataAttributeRules,
  MetadataCatalogAttributeRules,
  MetadataDocumentAttributeRules,
  MetadataTabularSectionAttributeRules,
} from "./rules"

type MetadataAttributeItemRule =
  | typeof MetadataAttributeRules
  | typeof MetadataCatalogAttributeRules
  | typeof MetadataDocumentAttributeRules
  | typeof MetadataTabularSectionAttributeRules

const importMetadataAttributeFromYAML = (
  context: ConfigurationContext,
  itemRule: MetadataAttributeItemRule,
  yaml: MetadataAttributeYAML | TypeDescriptionYAML,
  name: string
) => {
  if (typeof yaml === "string" || Array.isArray(yaml)) {
    const typeRule = itemRule.properties.type
    const type = importTypeDescriptionFromYAML(context, typeRule, yaml)
    if (!type) throw new Error("Type is required")

    return {
      itemType: itemRule.itemType,
      name,
      type,
      synonym: { items: { [context.defaultLanguage]: splitPascalCase(name) } },
    }
  }

  const properties = importMetadataItemFromYAML({
    context,
    yaml: yaml as MetadataAttributeYAML,
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

registerMetadataItemCollectionRule({
  propertyType: "MetadataCatalogAttributes",
  itemRule: MetadataCatalogAttributeRules,
  xmlElement: "Attribute",
  keyField: "name",
  fromYAML: createImportMetadataAttributesFromYAML(MetadataCatalogAttributeRules),
  graphChild: { idFrom: "name", edgeKind: "ATTRIBUTE", edgeYaml: "Реквизит", nodeSegment: "Реквизит" },
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataAttributes",
  itemRule: MetadataAttributeRules,
  xmlElement: "Attribute",
  keyField: "name",
  fromYAML: createImportMetadataAttributesFromYAML(MetadataAttributeRules),
  graphChild: { idFrom: "name", edgeKind: "ATTRIBUTE", edgeYaml: "Реквизит", nodeSegment: "Реквизит" },
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataTabularSectionAttributes",
  itemRule: MetadataTabularSectionAttributeRules,
  xmlElement: "Attribute",
  keyField: "name",
  fromYAML: createImportMetadataAttributesFromYAML(MetadataTabularSectionAttributeRules),
  graphChild: { idFrom: "name", edgeKind: "ATTRIBUTE", edgeYaml: "Реквизит", nodeSegment: "Реквизит" },
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataDocumentAttributes",
  itemRule: MetadataDocumentAttributeRules,
  xmlElement: "Attribute",
  keyField: "name",
  fromYAML: createImportMetadataAttributesFromYAML(MetadataDocumentAttributeRules),
  graphChild: { idFrom: "name", edgeKind: "ATTRIBUTE", edgeYaml: "Реквизит", nodeSegment: "Реквизит" },
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
