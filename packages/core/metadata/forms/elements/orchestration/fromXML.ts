import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { ToMetadata } from "~/metadata/orchestration/metadataItem/registry"
import { importPropertiesFromXML } from "~/metadata/orchestration/property/fromXML"
import { isEmptyMetadataItem } from "./helper"
import { getElementRule } from "./ruleFactory"
import { attachReferenceNameMode, type SingletonNameStyle } from "./singletonName"
import { CollectableElementType, ElementRule, ElementXML } from "./types"

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

  const props = importFromXML(context, xml, elementRule)

  if (props === undefined && !forReference) return undefined

  const result = {
    ...(forReference ? { id: xml._id } : {}),
    itemType: itemType,
    ...(props ?? {}),
  } as ToMetadata<Rule["itemType"]>

  if (!forReference && isEmptyMetadataItem({ context, rule: elementRule, element: result })) return undefined

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
