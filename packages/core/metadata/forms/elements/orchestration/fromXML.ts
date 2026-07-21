import { ConfigurationContextFromXML } from "../../../context/types"
import { ToMetadata } from "../../../orchestration/metadataItem/registry"
import { importPropertiesFromXML } from "../../../orchestration/property/fromXML"
import { isEmptyMetadataItem } from "./helper"
import { getElementRule } from "./ruleFactory"
import { attachReferenceNameMode, getCanonicalSingletonName, type SingletonNameStyle } from "./singletonName"
import { CollectableElementType, ElementRule, ElementXML } from "./types"
import { indexedUid } from "../../../configurationIndex/logicalAddress"
import {
  getConfigurationIndexFormElementLogicalAddress,
  getConfigurationIndexFormSingletonLogicalAddress,
  getConfigurationIndexCollectionContext,
  withConfigurationIndexLogicalAddress,
} from "../../../configurationIndex/collector/context"
import { collectConfigurationIndexIdentityFromXML } from "../../../configurationIndex/collector/collectProperty"

export function importSingleElementFromXML<Rule extends ElementRule>(params: {
  context: ConfigurationContextFromXML
  elementRule: ElementRule
  xml: ElementXML
  nameStyle?: SingletonNameStyle
  ownerXmlName?: string
}): ToMetadata<Rule["itemType"]> | undefined {
  const { context, elementRule, xml, nameStyle, ownerXmlName } = params
  const itemType = elementRule.itemType
  const forReference = context.fromXML.forReference

  if (xml === undefined) return undefined

  const collection = getConfigurationIndexCollectionContext(context)
  const canonicalName =
    collection === undefined
      ? undefined
      : getCanonicalSingletonName({ ownerLogicalAddress: ownerXmlName ?? collection.logicalAddress, nameStyle })
  if (collection?.formElementRootLogicalAddress !== undefined && nameStyle !== undefined && canonicalName === undefined) {
    throw new Error("Не удалось построить имя single-элемента формы для индекса конфигурации")
  }
  const elementContext =
    collection === undefined
      ? context
      : withConfigurationIndexLogicalAddress(
          context,
          canonicalName !== undefined
            ? nameStyle?.canonicalNameMode === "ownerSuffix"
              ? getConfigurationIndexFormSingletonLogicalAddress(collection, nameStyle.canonicalSuffix)
              : getConfigurationIndexFormElementLogicalAddress(collection, canonicalName)
            : indexedUid(collection.logicalAddress, "Элемент", 0)
        )
  collectConfigurationIndexIdentityFromXML({ context: elementContext, sourceXmlKey: "_id", xmlValue: xml._id })
  collectConfigurationIndexIdentityFromXML({
    context: elementContext,
    sourceXmlKey: "_name",
    xmlValue: xml._name,
    reconstructibleXmlName: canonicalName,
  })
  const props = importFromXML(elementContext, xml, elementRule)

  if (props === undefined && !forReference) return undefined

  const result = {
    ...(forReference ? { id: xml._id } : {}),
    itemType: itemType,
    ...(props ?? {}),
  } as ToMetadata<Rule["itemType"]>

  if (!forReference && isEmptyMetadataItem({ context: elementContext, rule: elementRule, element: result }))
    return undefined

  if (forReference) {
    return attachReferenceNameMode({
      model: result,
      xmlName: xml._name,
      ownerXmlName,
      nameStyle,
    })
  }

  return result
}

export function importElementFromXML<Type extends CollectableElementType>(params: {
  context: ConfigurationContextFromXML
  itemType: Type
  xml: ElementXML | undefined
  forReference?: boolean
}): ToMetadata<Type> | undefined {
  const { context, itemType, xml } = params

  if (xml === undefined) return undefined

  const rules = getElementRule(itemType)

  const props = importFromXML(context, xml, rules)

  const forReference = context.fromXML.forReference

  return {
    ...(forReference ? { id: xml._id } : {}),
    itemType: itemType,
    ...props,
  } as ToMetadata<Type>
}

export function importFromXML<Rule extends ElementRule>(
  context: ConfigurationContextFromXML,
  xml: ElementXML,
  elementRule: Rule
): Partial<ToMetadata<Rule["itemType"]>> | undefined {
  if (xml === undefined) return undefined

  const properties = importPropertiesFromXML({ context, xml, rule: elementRule })

  return {
    ...properties,
  } as Partial<ToMetadata<Rule["itemType"]>>
}
