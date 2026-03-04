import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import { exportEventsToYAML } from "~/metadata/orchestration/event"
import { MetadataItemTypeToMdItem, MetadataItemTypeToTypedYAML, MetadataItemTypeToYAML, TypedFormElement } from ".."
import { exportPropertyToYAML } from "../property/toYAML"
import { PropertyRule } from "../property/types"
import { getElementRule } from "./ruleFactory"
import { ElementRule, FormElementType, FormElementTypeToYAML, FormElementTypeToYAMLType } from "./types"

export const exportFormElementTypeToYAML = <T extends FormElementType>(
  _context: ConfigurationContext,
  itemType: T
): FormElementTypeToYAMLType<T> => {
  return FormElementTypeToYAML[itemType]
}

export function exportElementToTypedYAML<T extends TypedFormElement>(params: {
  context: ConfigurationContext
  element: T
}): MetadataItemTypeToTypedYAML<T["itemType"]> {
  const { context, element: data } = params

  const rules = getElementRule(data.itemType)

  const type = exportFormElementTypeToYAML(context, data.itemType)

  const result: MetadataItemTypeToTypedYAML<T["itemType"]> = {
    Тип: type,
  }

  const currentContext: ConfigurationContext = {
    ...context,
    exportToYAML: {
      toTyped: true,
    },
  }

  for (const [key, rule] of Object.entries(rules.properties) as [keyof T, PropertyRule][]) {
    const value = data[key]

    const exportedValues = exportPropertyToYAML({ context: currentContext, rule, value })

    if (exportedValues == undefined) continue

    Object.assign(result, exportedValues)
  }

  const events = exportEventsToYAML({ rule: rules, data: data })
  Object.assign(result, events)

  return result
}

export function exportElementToPartialYAML<T extends BaseElement>(params: {
  context: ConfigurationContext
  element: T | undefined
}): MetadataItemTypeToYAML<T["itemType"]> | undefined {
  const { context, element: element } = params
  if (element === undefined) return undefined

  const itemType = element.itemType

  const rule = getElementRule(itemType)

  return exportElementToYAML({
    context,
    element: element as unknown as MetadataItemTypeToMdItem<T["itemType"]>,
    rule,
  })
}

export function exportElementToYAML<Rule extends ElementRule>(params: {
  context: ConfigurationContext
  element: MetadataItemTypeToMdItem<Rule["itemType"]> | undefined
  rule: ElementRule
}): MetadataItemTypeToYAML<Rule["itemType"]> | undefined {
  const { context, element: element, rule: rule } = params
  if (element === undefined) return undefined

  type DataItem = MetadataItemTypeToMdItem<Rule["itemType"]>

  const result: MetadataItemTypeToYAML<Rule["itemType"]> = {}

  for (const [key, propertyRule] of Object.entries(rule.properties)) {
    const value = element[key as keyof DataItem]

    const exportedValues = exportPropertyToYAML({ context, rule: propertyRule, value })

    if (exportedValues == undefined) continue

    Object.assign(result, exportedValues)
  }

  const events = exportEventsToYAML({ rule: rule, data: element })
  Object.assign(result, events)

  if (Object.keys(result).length === 0) {
    return undefined
  }

  return result
}
