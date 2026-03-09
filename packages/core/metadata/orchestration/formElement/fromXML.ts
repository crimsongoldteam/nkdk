import { ConfigurationContextFromXML } from "~/metadata/context/types"
import {
  CollectableElementType,
  ElementRule,
  ElementXML,
  importPropertiesFromXML,
  ToMetadata,
} from "~/metadata/orchestration"
import { importEventsFromXML } from "../event/fromXML"
import { isEmptyMetadataItem } from "./helper"
import { getElementRule } from "./ruleFactory"

export function importSingleElementFromXML<Rule extends ElementRule>(params: {
  context: ConfigurationContextFromXML
  elementRule: ElementRule
  xml: ElementXML
  forReference?: boolean
}): ToMetadata<Rule["itemType"]> | undefined {
  const { context, elementRule, xml } = params
  const itemType = elementRule.itemType

  const props = importFromXML(context, xml, elementRule)

  if (props === undefined) return undefined

  const result = {
    itemType: itemType,
    ...(props ?? {}),
  } as ToMetadata<Rule["itemType"]>

  if (isEmptyMetadataItem({ context, rule: elementRule, element: result })) return undefined

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

  const events = importEventsFromXML(elementRule, xml)

  return {
    ...properties,
    ...events,
  } as Partial<ToMetadata<Rule["itemType"]>>
}
