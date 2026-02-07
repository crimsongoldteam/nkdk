import { exportFormattedI8nTextOtherToYAML } from "~/metadata/commonObjects/formattedI8nText/exportToEnterprise"
import { exportI8nTextOtherToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToYAML } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { EventedElement, NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { getElementRule, PropertyRule } from "../elementRulesFactory"
import { getTypeRule, TypeRulesNames } from "../typeRulesFactory"
import {
  exportFormElementTypeToEnterprise,
  FormElementType,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "../types"

export function exportElementToEnterpriseTyped<T extends NamedElement | EventedElement>(
  context: ConfigurationContext,
  elementType: FormElementType,
  data: T | undefined
): ToTypedEnterpriseType<T> | undefined {
  if (data === undefined) return undefined

  const rules = getElementRule<T>(elementType)

  const result: any = {
    Тип: exportFormElementTypeToEnterprise(context, undefined, elementType),
  }

  for (const [key, rule] of Object.entries(rules.properties) as [string, PropertyRule][]) {
    const value = (data as any)[key]

    if (value === undefined) continue

    const yamlKey = rule.yaml

    if (rule.type == "UserVisible") {
      const exportedValue = exportUserVisibleToYAML(context, rule, value)
      Object.assign(result, exportedValue)
      continue
    }

    const typeExportFn = getTypeRule(rule.type as TypeRulesNames, "exportToEnterprise")

    if (typeExportFn) {
      const exportedValue = (typeExportFn as any)(context, rule, value)
      if (exportedValue !== undefined) {
        result[yamlKey] = exportedValue
      }
    } else if (typeof value !== "object" || value === null) {
      result[yamlKey] = value
    }
  }

  return result as ToTypedEnterpriseType<T>
}

export function exportElementToEnterprisePartial<T extends NamedElement | EventedElement>(
  context: ConfigurationContext,
  elementType: FormElementType,
  data: T | undefined
): ToPartialEnterpriseType<T> | undefined {
  if (data === undefined) return undefined

  const rules = getElementRule<T>(elementType)

  const result = {} as ToPartialEnterpriseType<T>

  for (const [key, rule] of Object.entries(rules.properties) as [string, PropertyRule][]) {
    const value = (data as any)[key]

    if (value === undefined) continue

    const yamlKey = rule.yaml as keyof ToPartialEnterpriseType<T>

    if (rule.type == "UserVisible") {
      const exportedValue = exportUserVisibleToYAML(context, rule, value)
      Object.assign(result, exportedValue)
      continue
    }

    if (rule.type == "I8nText" && rule.yamlPartialOthers) {
      const exportedValue = exportI8nTextOtherToEnterprise(context, rule, value)
      if (exportedValue !== undefined) {
        Object.assign(result, exportedValue)
      }
      continue
    }

    if (rule.type == "FormattedI8nText" && rule.yamlPartialOthers) {
      Object.assign(result, exportFormattedI8nTextOtherToYAML(context, rule, value))
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

  const events = mapEventsToEnterprise(rules.events, "events" in data ? data.events : undefined)
  Object.assign(result, events)

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
