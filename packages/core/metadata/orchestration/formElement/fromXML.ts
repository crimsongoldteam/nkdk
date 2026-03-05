import { ConfigurationContext } from "~/metadata/context/types"
import {
  ElementRule,
  ElementXML,
  FormElementType,
  importPropertiesFromXML,
  MetadataItemTypeToMdItem,
} from "~/metadata/orchestration"
import { importEventsFromXML } from "../event/fromXML"
import { isEmptyMetadataItem } from "./helper"
import { getElementRule } from "./ruleFactory"

export const importSingleElementFromXML = <Rule extends ElementRule>(params: {
  context: ConfigurationContext
  elementRule: ElementRule
  xml: ElementXML
}): MetadataItemTypeToMdItem<Rule["itemType"]> | undefined => {
  const { context, elementRule, xml } = params
  const itemType = elementRule.itemType

  const props = importFromXML(context, xml, elementRule)

  if (props === undefined) return undefined

  const result = {
    itemType: itemType,
    ...(props ?? {}),
  } as MetadataItemTypeToMdItem<Rule["itemType"]>

  if (isEmptyMetadataItem({ context, rule: elementRule, element: result })) return undefined

  return result
}

export function importElementFromXML<Type extends FormElementType>(params: {
  context: ConfigurationContext
  itemType: Type
  xml: ElementXML | undefined
}): MetadataItemTypeToMdItem<Type> | undefined {
  const { context, itemType, xml } = params

  if (xml === undefined) return undefined

  const rules = getElementRule(itemType)

  const props = importFromXML(context, xml, rules)

  const result = {
    name: xml._name,
    itemType: itemType,
    ...props,
  } as MetadataItemTypeToMdItem<Type>

  return result
}

export function importFromXML<Rule extends ElementRule>(
  context: ConfigurationContext,
  xml: ElementXML,
  elementRule: Rule
): Partial<MetadataItemTypeToMdItem<Rule["itemType"]>> | undefined {
  if (xml === undefined) return undefined

  const properties = importPropertiesFromXML({ context, xml, rule: elementRule })

  const events = importEventsFromXML(elementRule, xml)

  return {
    ...properties,
    ...events,
  } as Partial<MetadataItemTypeToMdItem<Rule["itemType"]>>
}
