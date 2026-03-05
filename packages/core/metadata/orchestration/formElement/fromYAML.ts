import { ConfigurationContext } from "~/metadata/context/types"
import { MetadataItemTypeToMdItem, MetadataItemTypeToTypedYAML, MetadataItemTypeToYAML, TypedFormElement } from ".."
import { importEventsFromYAML } from "../event"
import { importPropertiesFromYAML } from "../property/fromYAML"
import { isEmptyMetadataItem } from "./helper"
import { getElementRule } from "./ruleFactory"
import {
  ElementRule,
  ExtendedFormElementType,
  FormElementType,
  FormElementTypeFromYAML,
  FormElementTypeFromYAMLType,
  FormElementTypeToYAMLType,
  SingleFormElementType,
} from "./types"

export const importFormElementTypeFromYAML = <D extends FormElementTypeToYAMLType<FormElementType>>(
  _context: ConfigurationContext,
  data: D
): FormElementTypeFromYAMLType<D> => {
  return FormElementTypeFromYAML[data] as FormElementTypeFromYAMLType<D>
}

export function importElementFromTypedYAML<T extends TypedFormElement>(params: {
  context: ConfigurationContext
  yaml: MetadataItemTypeToTypedYAML<T["itemType"]> & { События?: Record<string, string> }
  name: string
}): T {
  const { context, yaml: yaml, name } = params

  const itemType = importFormElementTypeFromYAML(params.context, yaml.Тип)

  const metadataRule = getElementRule(itemType)

  const properties = importPropertiesFromYAML({
    context,
    yaml: yaml as MetadataItemTypeToYAML<T["itemType"]> & { События?: Record<string, string> },
    metadataRule: metadataRule,
  })

  const events = importEventsFromYAML({
    rule: metadataRule,
    yaml: yaml,
  })

  const result = {
    ...properties,
    ...events,
    itemType: itemType,
    name: name,
  }

  return result as T
}

export const importSingleElementFromYAML = <Type extends SingleFormElementType>(params: {
  context: ConfigurationContext
  itemType: Type
  yaml: MetadataItemTypeToYAML<Type> | undefined
  source?: MetadataItemTypeToMdItem<Type>
}): MetadataItemTypeToMdItem<Type> | undefined => {
  const { context, itemType } = params

  const rules = getElementRule(itemType)

  const element = importElementFromPartialYAML(params)

  if (isEmptyMetadataItem({ context, rule: rules, element })) return undefined

  return element
}

export const importElementFromPartialYAML = <Type extends ExtendedFormElementType>(params: {
  context: ConfigurationContext
  itemType: Type
  yaml: MetadataItemTypeToYAML<Type> | undefined
  source?: MetadataItemTypeToMdItem<Type>
}): MetadataItemTypeToMdItem<Type> | undefined => {
  const { context, itemType, yaml, source } = params

  const rules = getElementRule(itemType)

  const element = importElementFromYAML({
    context: context,
    elementRule: rules,
    yaml: yaml,
    source: source,
  })

  return element
}

function importElementFromYAML<Rule extends ElementRule>(params: {
  context: ConfigurationContext
  elementRule: ElementRule
  yaml: MetadataItemTypeToYAML<Rule["itemType"]> | undefined
  source?: MetadataItemTypeToMdItem<Rule["itemType"]>
}): MetadataItemTypeToMdItem<Rule["itemType"]> {
  const { context, elementRule, yaml, source } = params
  const itemType = elementRule.itemType

  const properties = importPropertiesFromYAML({
    context,
    yaml,
    metadataRule: elementRule,
    source,
  })

  const events = importEventsFromYAML({
    rule: elementRule,
    yaml,
  })

  const result = {
    ...(source ? source : {}),
    ...properties,
    ...events,
    itemType: itemType,
  } as MetadataItemTypeToMdItem<Rule["itemType"]>

  return result
}
