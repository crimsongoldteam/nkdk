import { exportFormattedI8nTextOtherToYAML } from "~/metadata/commonObjects/formattedI8nText/exportToEnterprise"
import { exportI8nTextOtherToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { getElementRule, PropertyRule } from "../elementRulesFactory"
import { getTypeRule, TypeRulesNames } from "../typeRulesFactory"
import {
  exportFormElementTypeToEnterprise,
  ExportPartialToEnterpriseFn,
  ExportTypedToEnterpriseFn,
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

  const result: any = {
    Тип: exportFormElementTypeToEnterprise(context, undefined, elementType),
  }

  for (const [key, rule] of Object.entries(rules.properties) as [string, PropertyRule][]) {
    const value = (data as any)[key]

    if (value === undefined) continue

    const yamlKey = rule.yaml

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

export function exportElementToEnterprisePartial<T extends NamedElement>(
  context: ConfigurationContext,
  elementType: FormElementType,
  data: T | undefined
): ToPartialEnterpriseType<T> | undefined {
  if (data === undefined) return undefined

  const rules = getElementRule<T>(elementType)

  const result: any = {}

  for (const [key, rule] of Object.entries(rules.properties) as [string, PropertyRule][]) {
    const value = (data as any)[key]

    if (value === undefined) continue

    const yamlKey = rule.yaml

    if (rule.type == "I8nText" && rule.yamlPartial === "others") {
      result[yamlKey] = exportI8nTextOtherToEnterprise(context, rule, value)
      continue
    }

    if (rule.type == "FormattedI8nText" && rule.yamlPartial === "others") {
      result[yamlKey] = exportFormattedI8nTextOtherToYAML(context, rule, value)
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

  return result as ToPartialEnterpriseType<T>
}

export type { ExportPartialToEnterpriseFn, ExportTypedToEnterpriseFn }
