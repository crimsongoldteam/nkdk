import {
  ExportToXMLFunctionNew,
  ExportToYAMLFunction,
  ImportFromXMLFunction,
  importFromYAMLFunction,
} from "~/metadata/orchestration/property/fn"
import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "../formElement/factory"
import { ToMetadata } from "../metadataItem/registry"
import { importMetadataItemCollectionFromYAMLAsArray, importMetadataItemCollectionFromYAMLAsRecord } from "./fromYAML"
import { NamedMetadataItem } from "./types"

type CollectionRule<Rule extends MetadataItemRule, CollectionType extends PropertyRuleType, XMLKey extends string> = {
  propertyType: CollectionType
  itemRule: Rule
  xmlElement: XMLKey
  yamlAsArray?: true
  nameFromYAMLKey?: (yamlKey: string) => string
  yamlKeyFromName?: (name: string) => string
  fromXML?: ImportFromXMLFunction
  toXML?: ExportToXMLFunctionNew
  fromYAML?: importFromYAMLFunction
  toYAML?: ExportToYAMLFunction
  extendDataForExportToXML?: (params: {
    data: (ToMetadata<Rule["itemType"]> & NamedMetadataItem)[]
    rule: PropertyRule | undefined
  }) => (ToMetadata<Rule["itemType"]> & NamedMetadataItem)[]
  omitIdAttributeInXML?: boolean
}

export const registerMetadataItemCollectionRule = <
  Rule extends MetadataItemRule,
  CollectionType extends PropertyRuleType,
  XMLKey extends string,
>(
  params: CollectionRule<Rule, CollectionType, XMLKey>
): void => {
  const { propertyType, itemRule, xmlElement } = params

  const fromXML = params.fromXML ? params.fromXML : importMetadataItemCollectionFromXML
  registerTypeRule(propertyType, "importFromXML", fromXML)

  const fromYAML = params.fromYAML
    ? params.fromYAML
    : params.yamlAsArray
      ? importMetadataItemCollectionFromYAMLAsArray
      : importMetadataItemCollectionFromYAMLAsRecord

  registerTypeRule(propertyType, "importFromYAML", fromYAML)

  const toYAML = params.toYAML ? params.toYAML : exportMetadataItemCollectionToYAML
  registerTypeRule(propertyType, "exportToYAML", toYAML)

  const toXML = params.toXML ? params.toXML : exportMetadataItemCollectionToXML
  registerTypeRule(propertyType, "exportToXML", toXML)
}
