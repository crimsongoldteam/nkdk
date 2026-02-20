import { ConfigurationContext } from "~/metadata/context/types"
import { TypedElement } from "~/metadata/forms/collections/childItems/types"
import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import { exportEventsToYAML } from "../events"
import { exportFormElementTypeToEnterprise } from "../metadataType/toYAML"
import { exportPropertyToYAML } from "../properties/toYAML"
import { PropertyRule } from "../properties/types"
import { ToTypedYAML, ToYAML } from "../rules"
import { getElementRule } from "./factory"
import { ElementRule } from "./types"

export function exportElementToTypedYAML<T extends TypedElement>(params: {
  context: ConfigurationContext
  element: T
}): ToTypedYAML<T> {
  const { context, element: data } = params

  const rules = getElementRule<T>(data.itemType)

  const type = exportFormElementTypeToEnterprise(context, data.itemType)

  const result: ToTypedYAML<T> = {
    Тип: type,
  } as ToTypedYAML<T>

  const currentContext: ConfigurationContext = {
    ...context,
    exportToYAML: {
      toTyped: true,
    },
  }

  for (const [key, rule] of Object.entries(rules.properties) as [keyof T, PropertyRule<T>][]) {
    const value = data[key]

    const exportedValues = exportPropertyToYAML({ context: currentContext, rule, value })

    if (exportedValues == undefined) continue

    Object.assign(result, exportedValues)
  }

  const events = exportEventsToYAML({ rule: rules, data: data })
  Object.assign(result, events)

  return result as ToTypedYAML<T>
}

export function exportElementToPartialYAML<T extends BaseElement>(params: {
  context: ConfigurationContext
  element: T | undefined
}): ToYAML<T> | undefined {
  const { context, element: data } = params
  if (data === undefined) return undefined
  const itemType = data.itemType

  const rules = getElementRule<T>(itemType)

  return exportElementToYAML({ context, data, rules })
}

export function exportElementToYAML<T extends BaseElement>(params: {
  context: ConfigurationContext
  data: T | undefined
  rules: ElementRule<T>
}): ToYAML<T> | undefined {
  const { context, data, rules } = params
  if (data === undefined) return undefined

  const result = {}

  for (const [key, rule] of Object.entries(rules.properties) as [keyof T, PropertyRule<T>][]) {
    const value = data[key]

    const exportedValues = exportPropertyToYAML({ context, rule, value })

    if (exportedValues == undefined) continue

    Object.assign(result, exportedValues)
  }

  const events = exportEventsToYAML({ rule: rules, data: data })
  Object.assign(result, events)

  if (Object.keys(result).length === 0) {
    return undefined
  }

  return result as ToYAML<T>
}

// Moved to ../events/mapEventsToEnterprise.ts
