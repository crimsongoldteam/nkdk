import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
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
}

export const registerMetadataItemCollectionRule = <
  Rule extends MetadataItemRule,
  CollectionType extends PropertyRuleType,
  XMLKey extends string,
>(
  params: CollectionRule<Rule, CollectionType, XMLKey>
): void => {
  const { propertyType, itemRule, xmlElement } = params

  registerImportFromXML(propertyType, itemRule, xmlElement)
  registerImportFromYAML(propertyType, itemRule, params.nameFromYAMLKey, params.returnUndefinedWhenEmptyYAML)
  registerExportToYAML(propertyType, itemRule, params.yamlKeyFromName)
  registerExportToXML(propertyType, itemRule, xmlElement, params.extendDataForExportToXML, params.omitIdAttributeInXML)
}
