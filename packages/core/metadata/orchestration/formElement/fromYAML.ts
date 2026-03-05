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
    rules: rules,
    yaml: yaml,
    source: source,
  })

  return element
}

function importElementFromYAML<Rule extends ElementRule>(params: {
  context: ConfigurationContext
  rules: ElementRule
  yaml: MetadataItemTypeToYAML<Rule["itemType"]> | undefined
  source?: MetadataItemTypeToMdItem<Rule["itemType"]>
}): MetadataItemTypeToMdItem<Rule["itemType"]> | undefined {
  const { context, rules, yaml, source } = params
  const itemType = rules.itemType
  // if (yaml === undefined) return source

  const properties = importPropertiesFromYAML({
    context,
    yaml: yaml,
    metadataType: itemType,
    metadataRule: rules,
    source,
  })

  const events = importEventsFromYAML({
    rule: rules,
    yaml: yaml,
  })

  const result: T = {
    ...(source ? source : {}),
    ...properties,
    ...events,
    itemType: itemType,
  }

  return result
}
