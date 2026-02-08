import { exportUserVisibleToYAML } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { UserVisible } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { TypedElement } from "~/metadata/forms/collections/childItems/types"
import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import { ElementRule, getElementRule, PropertyRule } from "../elementRulesFactory"
import { getTypeRule, TypeRulesNames } from "../typeRulesFactory"
import { exportFormElementTypeToEnterprise, ToPartialEnterpriseType, ToTypedEnterpriseType } from "../types"

export function exportElementToTypedYAML<T extends TypedElement>(params: {
  context: ConfigurationContext
  element: T
}): ToTypedEnterpriseType<T> {
  const { context, element: data } = params

  const rules = getElementRule<T>(data.elementType)

  const type = exportFormElementTypeToEnterprise(context, undefined, data.elementType)

  const result: ToTypedEnterpriseType<T> = {
    Тип: type,
  } as ToTypedEnterpriseType<T>

  for (const [key, rule] of Object.entries(rules.properties) as [string, PropertyRule<T>][]) {
    const value = data[key as keyof T]

    const yamlKey = rule.yaml

    if (rule.type == "UserVisible") {
      const exportedValue = exportUserVisibleToYAML(context, rule, value as UserVisible)
      Object.assign(result, exportedValue)
      continue
    }

    const typeExportFn = getTypeRule(rule.type as TypeRulesNames, "exportToEnterprise")

    if (!typeExportFn) {
      if (value === undefined) continue
      ;(result as any)[yamlKey] = value
      continue
    }

    const exportedValue = typeExportFn(context, rule, value)
    if (exportedValue !== undefined) {
      ;(result as any)[yamlKey] = exportedValue
    }
  }

  return result as ToTypedEnterpriseType<T>
}

export function exportSingleElementToEnterprise<T extends BaseElement>(
  context: ConfigurationContext,
  data: T | undefined,
  params: { rules: ElementRule<T> }
): ToPartialEnterpriseType<T> | undefined {
  return exportToEnterprisePartial(context, data, { rules: params.rules })
}

export function exportElementToPartialYAML<T extends BaseElement>(params: {
  context: ConfigurationContext
  element: T | undefined
}): ToPartialEnterpriseType<T> | undefined {
  const { context, element: data } = params
  if (data === undefined) return undefined
  const elementType = data.elementType

  const rules = getElementRule<T>(elementType)

  return exportToEnterprisePartial(context, data, { rules })
}

function exportToEnterprisePartial<T extends BaseElement>(
  context: ConfigurationContext,
  data: T | undefined,
  params: { rules: ElementRule<T> }
): ToPartialEnterpriseType<T> | undefined {
  if (data === undefined) return undefined

  const rules = params.rules

  const result = {}

  for (const [key, rule] of Object.entries(rules.properties) as [keyof T, PropertyRule<T>][]) {
    if (rule.toYAML === false) continue
    const value = data[key]

    if (value === undefined) continue

    const yamlKey = rule.yaml as string

    if (rule.type == "UserVisible") {
      const exportedValue = exportUserVisibleToYAML(context, rule, value as UserVisible)
      Object.assign(result, exportedValue)
      continue
    }

    const typeExportFn = getTypeRule(rule.type as TypeRulesNames, "exportToEnterprise")

    if (!typeExportFn) {
      ;(result as any)[yamlKey] = value
      continue
    }

    const exportedValue = typeExportFn(context, rule, value)
    if (exportedValue !== undefined) {
      ;(result as any)[yamlKey] = exportedValue
    }
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
