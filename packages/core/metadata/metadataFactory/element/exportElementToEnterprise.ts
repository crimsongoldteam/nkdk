import { exportUserVisibleToYAML } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement, NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { ElementRule, getElementRule, PropertyRule } from "../elementRulesFactory"
import { getTypeRule, TypeRulesNames } from "../typeRulesFactory"
import {
  exportFormElementTypeToEnterprise,
  FormElementType,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "../types"

export function exportElementToEnterpriseTyped<T extends NamedElement>(
  context: ConfigurationContext,
  elementType: FormElementType,
  data: T | undefined
): ToTypedEnterpriseType<T> | undefined {
  if (data === undefined) return undefined

  const rules = getElementRule<T>(elementType)

  const result: ToTypedEnterpriseType<T> = {
    Тип: exportFormElementTypeToEnterprise(context, undefined, elementType),
  }

  for (const [key, rule] of Object.entries(rules.properties) as [string, PropertyRule<T>][]) {
    const value = data[key as keyof T]

    if (value === undefined) continue

    const yamlKey = rule.yaml

    if (rule.type == "UserVisible") {
      const exportedValue = exportUserVisibleToYAML(context, rule, value)
      Object.assign(result, exportedValue)
      continue
    }

    const typeExportFn = getTypeRule(rule.type as TypeRulesNames, "exportToEnterprise")

    if (typeExportFn) {
      const exportedValue = typeExportFn(context, rule, value)
      if (exportedValue !== undefined) {
        result[yamlKey as string] = exportedValue
      }
    } else if (typeof value !== "object" || value === null) {
      result[yamlKey as string] = value
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

export function exportElementToEnterprisePartial<T extends BaseElement>(
  context: ConfigurationContext,
  elementType: FormElementType,
  data: T | undefined
): ToPartialEnterpriseType<T> | undefined {
  if (data === undefined) return undefined

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

  const result: Record<string, unknown> = {}

  for (const [key, rule] of Object.entries(rules.properties) as [string, PropertyRule<T>][]) {
    if (rule.toYAML === false) continue
    const value = data[key as keyof T]

    if (value === undefined) continue

    const yamlKey = rule.yaml as string

    if (rule.type == "UserVisible") {
      const exportedValue = exportUserVisibleToYAML(context, rule, value)
      if (exportedValue !== undefined) {
        Object.assign(result, exportedValue)
      }
      continue
    }

    const typeExportFn = getTypeRule(rule.type as TypeRulesNames, "exportToEnterprise")

    if (!typeExportFn) {
      result[yamlKey] = value
      continue
    }

    const exportedValue = typeExportFn(context, rule, value)
    if (exportedValue !== undefined) {
      result[yamlKey] = exportedValue
    }
  }

  const events = mapEventsToEnterprise(
    rules.events,
    data.events !== undefined ? (data.events as Record<string, string>) : undefined
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
