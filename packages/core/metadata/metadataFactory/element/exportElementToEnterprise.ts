import { exportFormattedI8nTextToYAML } from "~/metadata/commonObjects/formattedI8nText/exportToEnterprise"
import { exportUserVisibleToYAML } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { UserVisible } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { TypedElement } from "~/metadata/forms/collections/childItems/types"
import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import { ElementRule, getElementRule, PropertyRule } from "../elementRulesFactory"
import { getTypeRule, TypeRulesNames } from "../typeRulesFactory"
import { exportFormElementTypeToEnterprise, ToPartialEnterpriseType, ToTypedEnterpriseType } from "../types"

export const exportPropertyToYAML = <T extends BaseElement>(params: {
  context: ConfigurationContext
  rule: PropertyRule<T>
  value: any
}): Record<string, any> | undefined => {
  const { context, rule, value } = params

  if (rule.yaml === undefined) return undefined

  if (rule.toYAML === false) return undefined

  if (rule.type == "UserVisible") {
    const result = exportUserVisibleToYAML(context, rule, value as UserVisible)
    return result
  }

  if (rule.type == "FormattedI8nText") {
    const result = exportFormattedI8nTextToYAML(context, rule, value)
    return result
  }

  const yamlKey = rule.yaml

  const typeExportFn = getTypeRule(rule.type as TypeRulesNames, "exportToEnterprise")

  if (!yamlKey) {
    return undefined
  }

  if (!typeExportFn) {
    if (value === undefined) return undefined
    return { [yamlKey]: value }
  }

  const result = typeExportFn(context, rule, value)
  return result ? { [yamlKey]: result } : undefined
}

export function exportElementToTypedYAML<T extends TypedElement>(params: {
  context: ConfigurationContext
  element: T
}): ToTypedEnterpriseType<T> {
  const { context, element: data } = params

  const rules = getElementRule<T>(data.elementType)

  const type = exportFormElementTypeToEnterprise(context, data.elementType)

  const result: ToTypedEnterpriseType<T> = {
    Тип: type,
  } as ToTypedEnterpriseType<T>

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

  return result as ToTypedEnterpriseType<T>
}

export function exportElementToPartialYAML<T extends BaseElement>(params: {
  context: ConfigurationContext
  element: T | undefined
}): ToPartialEnterpriseType<T> | undefined {
  const { context, element: data } = params
  if (data === undefined) return undefined
  const elementType = data.elementType

  const rules = getElementRule<T>(elementType)

  return exportElementToYAML({ context, data, rules })
}

export function exportElementToYAML<T extends BaseElement>(params: {
  context: ConfigurationContext
  data: T | undefined
  rules: ElementRule<T>
}): ToPartialEnterpriseType<T> | undefined {
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

  return result as ToPartialEnterpriseType<T>
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
