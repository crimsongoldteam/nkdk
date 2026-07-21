import { ConfigurationContextFromXML } from "../../context/types"
import { ImportFromXMLFunction } from "../property/fn"
import { PropertyRuleType } from "../property/registry"
import type { ConfigurationIndexAddressingMode, ItemXML, MetadataItemRule, PropertyRule } from "../property/types"
import { registerTypeRule } from "../property/typeRuleRegistry"
import { importMetadataItemFromXML } from "../metadataItem/fromXML"
import { ToMetadata } from "../metadataItem/registry"
import type { NamedElementXML, NamedMetadataItem } from "./types"
import { childUid, indexedUid, yamlIndexUid, yamlKeyUid } from "../../configurationIndex/logicalAddress"
import {
  getConfigurationIndexCollectionContext,
  withConfigurationIndexLogicalAddress,
} from "../../configurationIndex/collector/context"

export const importMetadataItemCollectionFromXML = <Rule extends MetadataItemRule, XMLKey extends string>(
  itemRule: Rule,
  xmlElement: XMLKey,
  options?: MetadataItemCollectionImportOptions
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
        const itemContext = configurationIndexItemContext({
          context,
          item,
          itemRule,
          index,
          options,
        })
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

export type MetadataItemCollectionImportOptions = {
  propertyType?: PropertyRuleType
  configurationIndexUidSegment?: string
  configurationIndexAddressing?: ConfigurationIndexAddressingMode
  yamlAsArray?: true
}

export function configurationIndexItemContext(params: {
  context: ConfigurationContextFromXML
  item: ItemXML
  itemRule: MetadataItemRule
  index: number
  options?: MetadataItemCollectionImportOptions
}): ConfigurationContextFromXML {
  const { context, item, itemRule, index, options } = params
  const collection = getConfigurationIndexCollectionContext(context)
  if (collection === undefined) return context

  const itemName = configurationIndexItemName(item, itemRule)
  const registeredUidSegment = options?.configurationIndexUidSegment
  const useYamlPath = collection.yamlPathAddressing === true || options?.configurationIndexAddressing === "yamlPath"

  if (useYamlPath) {
    return withConfigurationIndexLogicalAddress(
      context,
      options?.yamlAsArray === true || itemName === undefined
        ? yamlIndexUid(collection.logicalAddress, index)
        : yamlKeyUid(collection.logicalAddress, itemName)
    )
  }

  if (registeredUidSegment !== undefined && itemName === undefined) {
    throw new Error(
      `Адресуемая metadata-item коллекция ${options?.propertyType ?? itemRule.itemType} содержит элемент без имени`
    )
  }

  const uidSegment = registeredUidSegment ?? collection.childCollectionUidSegment
  if (uidSegment === undefined) return context

  return withConfigurationIndexLogicalAddress(
    context,
    itemName === undefined
      ? indexedUid(collection.logicalAddress, uidSegment, index)
      : childUid(collection.logicalAddress, uidSegment, itemName)
  )
}

function configurationIndexItemName(item: ItemXML, itemRule: MetadataItemRule): string | undefined {
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
