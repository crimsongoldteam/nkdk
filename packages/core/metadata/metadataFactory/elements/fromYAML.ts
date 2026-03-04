import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement, NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { importEventsFromYAML } from "../events"
import { importFormElementTypeFromYAML } from "../metadataType/fromYAML"
import { FormElementType } from "../metadataType/types"
import { importPropertiesFromYAML } from "../properties/fromYAML"
import { ToTypedYAML, ToYAML } from "../rules"
import { isEmptyMetadataItem } from "./helper"
import { getElementRule } from "./ruleFactory"
import { ElementRule } from "./types"

export function importElementFromTypedYAML<T extends NamedElement>(params: {
  context: ConfigurationContext
  yaml: ToTypedYAML<T> & { События?: Record<string, string> }
  name: string
}): T {
  const { context, yaml: yaml, name } = params

  const itemType = importFormElementTypeFromYAML(params.context, yaml.Тип)

  const rules = getElementRule<T>(itemType)

  const properties = importPropertiesFromYAML({
    context,
    yaml: yaml as ToYAML<T> & { События?: Record<string, string> },
    metadataType: itemType,
    rules,
  })

  const events = importEventsFromYAML({
    rule: rules,
    yaml: yaml,
  })

  const result: T = {
    ...properties,
    ...events,
    itemType: itemType,
    name: name,
  }

  return result as T
}

export const importSingleElementFromYAML = <T extends BaseElement>(params: {
  context: ConfigurationContext
  itemType: FormElementType
  yaml: ToYAML<T> | undefined
  source?: T
}): T | undefined => {
  const { context, itemType } = params

  const rules = getElementRule<T>(itemType)

  const element = importElementFromPartialYAML(params)

  if (isEmptyMetadataItem({ context, rule: rules, element })) return undefined

  return element
}

export const importElementFromPartialYAML = <T extends BaseElement>(params: {
  context: ConfigurationContext
  itemType: FormElementType
  yaml: ToYAML<T> | undefined
  source?: T
}): T | undefined => {
  const { context, itemType, yaml, source } = params

  const rules = getElementRule<T>(itemType)

  const element = importElementFromYAML({
    context: context,
    rules: rules,
    yaml: yaml as ToYAML<T> & { События?: Record<string, string> },
    itemType: itemType,
    source: source,
  })

  return element
}

function importElementFromYAML<T extends BaseElement>(params: {
  context: ConfigurationContext
  rules: ElementRule
  itemType: FormElementType
  yaml: (ToYAML<T> & { События?: Record<string, string> }) | undefined
  source?: T
}): T | undefined {
  const { context, rules, yaml, source, itemType } = params
  // if (yaml === undefined) return source

  const properties = importPropertiesFromYAML({
    context,
    yaml: yaml as ToYAML<T> & { События?: Record<string, string> },
    metadataType: itemType,
    rules,
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
