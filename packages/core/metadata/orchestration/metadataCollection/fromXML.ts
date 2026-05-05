import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { ImportFromXMLFunction } from "~/metadata/orchestration/property/fn"
import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "../formElement/factory"
import { importMetadataItemFromXML } from "../metadataItem/fromXML"
import { ToMetadata } from "../metadataItem/registry"
import { NamedElementXML, NamedMetadataItem } from "./types"

export const importMetadataItemCollectionFromXML = <
  Rule extends MetadataItemRule,
  XMLKey extends string,
>(
  itemRule: Rule,
  xmlElement: XMLKey
): ImportFromXMLFunction => {
  return (
    context: ConfigurationContextFromXML,
    _rule: PropertyRule,
    xml: Record<XMLKey, NamedElementXML | NamedElementXML[]> | undefined
  ): (ToMetadata<Rule["itemType"]> & NamedMetadataItem)[] | undefined => {
    if (!xml || !xml[xmlElement]) return undefined

    const xmlArray = Array.isArray(xml[xmlElement]) ? xml[xmlElement] : [xml[xmlElement]]

    const imported = xmlArray
      .map((item) => {
        const properties = importMetadataItemFromXML({
          context,
          xml: item,
          rule: itemRule,
        })
        if (!properties) return undefined
        return {
          ...properties,
          ...(item._name !== undefined ? { name: item._name } : {}),
        } as ToMetadata<Rule["itemType"]> & NamedMetadataItem
      })
      .filter((item): item is ToMetadata<Rule["itemType"]> & NamedMetadataItem => item !== undefined)

    return imported.length > 0 ? imported : undefined
  }
}

export const registerImportFromXML = <
  Rule extends MetadataItemRule,
  CollectionType extends PropertyRuleType,
  XMLKey extends string,
>(
  propertyType: CollectionType,
  itemRule: Rule,
  xmlElement: XMLKey
): void => {
  registerTypeRule(propertyType, "importFromXML", importMetadataItemCollectionFromXML(itemRule, xmlElement))
}
