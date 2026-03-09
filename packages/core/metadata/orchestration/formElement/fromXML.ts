import { ConfigurationContext } from "~/metadata/context/types"
import {
  CollectableElementType,
  ElementRule,
  ElementXML,
  importPropertiesFromXML,
  ToMetadata,
  ToReference,
} from "~/metadata/orchestration"
import { importEventsFromXML } from "../event/fromXML"
import { isEmptyMetadataItem } from "./helper"
import { getElementRule } from "./ruleFactory"

export function importSingleElementFromXML<Rule extends ElementRule>(params: {
  context: ConfigurationContext
  elementRule: ElementRule
  xml: ElementXML
  forReference?: boolean
}): ToMetadata<Rule["itemType"]> | ToReference<Rule["itemType"]> | undefined {
  const { context, elementRule, xml } = params
  const forReference = params.forReference ?? false
  const itemType = elementRule.itemType

  const props = importFromXML(context, xml, elementRule, forReference)

  if (props === undefined) return undefined

  const result = {
    itemType: itemType,
    ...(props ?? {}),
  } as ToMetadata<Rule["itemType"]> | ToReference<Rule["itemType"]>

  if (isEmptyMetadataItem({ context, rule: elementRule, element: result })) return undefined

  return result
}

export function importElementFromXML<Type extends CollectableElementType>(params: {
  context: ConfigurationContext
  itemType: Type
  xml: ElementXML | undefined
  forReference?: boolean
}): ToMetadata<Type> | ToReference<Type> | undefined {
  const { context, itemType, xml } = params
  const forReference = params.forReference ?? false

  if (xml === undefined) return undefined

  const rules = getElementRule(itemType)

  const props = importFromXML(context, xml, rules, forReference)

  return {
    ...(forReference ? { id: xml._id } : {}),
    itemType: itemType,
    ...props,
  } as ToMetadata<Type>
}

export function importFromXML<Rule extends ElementRule>(
  context: ConfigurationContext,
  xml: ElementXML,
  elementRule: Rule,
  forReference: boolean
): Partial<ToMetadata<Rule["itemType"]>> | Partial<ToReference<Rule["itemType"]>> | undefined {
  if (xml === undefined) return undefined

  const properties = forReference
    ? importPropertiesFromXML({ context, xml, rule: elementRule, forReference: true })
    : importPropertiesFromXML({ context, xml, rule: elementRule })

  const events = importEventsFromXML(elementRule, xml)

  return {
    ...properties,
    ...events,
  } as Partial<ToMetadata<Rule["itemType"]>> | Partial<ToReference<Rule["itemType"]>>
}
