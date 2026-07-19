import { ConfigurationContextFromXML } from "../../context/types"
import { ImportFromXMLFunction } from "../property/fn"
import { PropertyRuleType } from "../property/registry"
import type { MetadataItemRule, PropertyRule } from "../property/types"
import { registerTypeRule } from "../property/typeRuleRegistry"
import { importMetadataItemFromXML } from "../metadataItem/fromXML"
import { ToMetadata } from "../metadataItem/registry"
import type { NamedElementXML, NamedMetadataItem } from "./types"
import { childUid, indexedUid } from "../../configurationIndex/logicalAddress"
import {
  getConfigurationIndexCollectionContext,
  withConfigurationIndexLogicalAddress,
} from "../../configurationIndex/collector/context"

export const importMetadataItemCollectionFromXML = <Rule extends MetadataItemRule, XMLKey extends string>(
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
      .map((item, index) => {
        const collection = getConfigurationIndexCollectionContext(context)
        const itemName = configurationIndexItemName(item, itemRule)
        const itemContext =
          collection?.childCollectionUidSegment === undefined
            ? context
            : withConfigurationIndexLogicalAddress(
                context,
                itemName === undefined
                  ? indexedUid(collection.logicalAddress, collection.childCollectionUidSegment, index)
                  : childUid(collection.logicalAddress, collection.childCollectionUidSegment, itemName)
              )
        const properties = importMetadataItemFromXML({
          context: itemContext,
          xml: item,
          rule: itemRule,
        })
        if (!properties) return undefined
        const result = {
          ...properties,
          ...(item._name !== undefined ? { name: item._name } : {}),
        } as ToMetadata<Rule["itemType"]> & NamedMetadataItem
        for (const key of Object.getOwnPropertyNames(properties)) {
          const descriptor = Object.getOwnPropertyDescriptor(properties, key)
          if (descriptor && descriptor.enumerable === false) Object.defineProperty(result, key, descriptor)
        }
        return result
      })
      .filter((item): item is ToMetadata<Rule["itemType"]> & NamedMetadataItem => item !== undefined)

    return imported.length > 0 ? imported : undefined
  }
}

function configurationIndexItemName(item: NamedElementXML, itemRule: MetadataItemRule): string | undefined {
  if (typeof item._name === "string" && item._name.length > 0) return item._name

  const nameRule = itemRule.properties.name
  if (nameRule === undefined) return undefined
  let source: unknown = item
  for (const parent of nameRule.xmlParents ?? []) {
    if (source === null || typeof source !== "object") return undefined
    source = (source as Record<string, unknown>)[parent]
  }
  if (source === null || typeof source !== "object") return undefined
  for (const key of [nameRule.xml ?? "Name", ...(nameRule.xmlAliases ?? [])]) {
    const value = (source as Record<string, unknown>)[key]
    if (typeof value === "string" && value.length > 0) return value
  }
  return undefined
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
