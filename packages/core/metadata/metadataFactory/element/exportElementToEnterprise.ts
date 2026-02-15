import { ConfigurationContext } from "~/metadata/context/types"
import { TypedElement } from "~/metadata/forms/collections/childItems/types"
import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import { ElementRule, getElementRule } from "../elementRulesFactory"
import { exportFormElementTypeToEnterprise } from "../metadataType/toYAML"
import { exportPropertyToYAML } from "../properties/toYAML"
import { PropertyRule } from "../properties/types"
import { ToTypedYAML, ToYAML } from "../rules"

// export const exportPropertyToYAML = <T extends BaseElement>(params: {
//   context: ConfigurationContext
//   rule: PropertyRule<T>
//   value: any
//   toTyped?: true
// }): Record<string, any> | undefined => {
//   const { context, rule, value, toTyped } = params

//   if (rule.yaml === undefined) return undefined

//   if (!toTyped && rule.toPartialYAML === false) return undefined

//   if (rule.type == "UserVisible") {
//     const result = exportUserVisibleToYAML(context, rule, value as UserVisible)
//     return result
//   }

//   if (rule.type == "FormattedI8nText") {
//     const tempRule: FormattedI8nTextPropertyRule<T> = {
//       ...rule,
//       yamlPartialOthers: toTyped ? undefined : rule.yamlPartialOthers,
//     }
//     const result = exportFormattedI8nTextToYAML(context, tempRule, value)
//     return result
//   }

//   const yamlKey = rule.yaml

//   if (rule.type == "I8nText") {
//     const tempRule: I8nTextPropertyRule<T> = {
//       ...rule,
//       yamlPartialOthers: toTyped ? undefined : rule.yamlPartialOthers,
//     }
//     const result = exportI8nTextToYAML(context, tempRule, value)
//     if (result === undefined) return undefined

//     return { [yamlKey]: result }
//   }

//   const typeExportFn = getTypeRule(rule.type as TypeRulesNames, "exportToEnterprise")

//   if (!yamlKey) {
//     return undefined
//   }

//   if (!typeExportFn) {
//     if (value === undefined) return undefined
//     return { [yamlKey]: value }
//   }

//   const result = typeExportFn(context, rule, value)
//   return result ? { [yamlKey]: result } : undefined
// }

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

  for (const [key, rule] of Object.entries(rules.properties) as [keyof T, PropertyRule<T>][]) {
    const value = data[key]

    const exportedValues = exportPropertyToYAML({ context, rule, value, toTyped: true })

    if (exportedValues == undefined) continue

    Object.assign(result, exportedValues)
  }

  const events = mapEventsToEnterprise(
    rules.events,
    "events" in data ? (data.events as Record<string, string>) : undefined
  )
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

  const events = mapEventsToEnterprise(
    rules.events,
    "events" in data ? (data.events as Record<string, string>) : undefined
  )
  Object.assign(result, events)

  if (Object.keys(result).length === 0) {
    return undefined
  }

  return result as ToYAML<T>
}

function mapEventsToEnterprise(
  rulesEvents: Record<string, string> | undefined,
  dataEvents: Record<string, string> | undefined
): { События?: Record<string, string> } {
  if (!rulesEvents || !dataEvents) {
    return {}
  }

  const result: Record<string, string> = {}

  for (const [ruleKey, enterpriseName] of Object.entries(rulesEvents)) {
    const eventValue = dataEvents[ruleKey]
    if (eventValue === undefined) continue

    result[enterpriseName] = eventValue
  }

  return { События: result }
}
