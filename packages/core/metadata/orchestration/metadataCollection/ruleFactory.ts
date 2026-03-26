import {
  ExportToXMLFunction,
  ExportToYAMLFunction,
  importFromXMLFunction,
  importFromYAMLFunction,
} from "~/metadata/orchestration/property/fn"
import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "../formElement/factory"
import { ToMetadata } from "../metadataItem/registry"
import { registerExportToXML } from "./registerExportToXML"
import { registerExportToYAML } from "./registerExportToYAML"
import { registerImportFromXML } from "./registerImportFromXML"
import { registerImportFromYAML } from "./registerImportFromYAML"
import { NamedMetadataItem } from "./types"

type CollectionRule<Rule extends MetadataItemRule, CollectionType extends PropertyRuleType, XMLKey extends string> = {
  propertyType: CollectionType
  itemRule: Rule
  xmlElement: XMLKey
  nameFromYAMLKey?: (yamlKey: string) => string
  yamlKeyFromName?: (name: string) => string
  returnUndefinedWhenEmptyYAML?: boolean
  extendDataForExportToXML?: (params: {
    data: (ToMetadata<Rule["itemType"]> & NamedMetadataItem)[]
    rule: PropertyRule | undefined
  }) => (ToMetadata<Rule["itemType"]> & NamedMetadataItem)[]
  omitIdAttributeInXML?: boolean
  fromXML?: importFromXMLFunction
  toXML?: ExportToXMLFunction
  fromYAML?: importFromYAMLFunction
  toYAML?: ExportToYAMLFunction
}

export const registerMetadataItemCollectionRule = <
  Rule extends MetadataItemRule,
  CollectionType extends PropertyRuleType,
  XMLKey extends string,
>(
  params: CollectionRule<Rule, CollectionType, XMLKey>
): void => {
  const { propertyType, itemRule, xmlElement } = params

  if (params.fromXML) {
    registerTypeRule(propertyType, "importFromXML", params.fromXML)
  } else {
    registerImportFromXML(propertyType, itemRule, xmlElement)
  }

  if (params.fromYAML) {
    registerTypeRule(propertyType, "importFromYAML", params.fromYAML)
  } else {
    registerImportFromYAML(propertyType, itemRule, params.nameFromYAMLKey, params.returnUndefinedWhenEmptyYAML)
  }

  if (params.toYAML) {
    registerTypeRule(propertyType, "exportToYAML", params.toYAML)
  } else {
    registerExportToYAML(propertyType, itemRule, params.yamlKeyFromName)
  }

  if (params.toXML) {
    registerTypeRule(propertyType, "exportToXML", params.toXML)
  } else {
    registerExportToXML(
      propertyType,
      itemRule,
      xmlElement,
      params.extendDataForExportToXML,
      params.omitIdAttributeInXML
    )
  }
}
