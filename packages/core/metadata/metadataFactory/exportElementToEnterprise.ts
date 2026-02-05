import { ConfigurationContext } from "../context/types"
import { NamedElement } from "../forms/elements/baseElement/types"
import { getElementRule } from "./elementRulesFactory"
import { getTypeRule } from "./typeRulesFactory"
import {
  exportFormElementTypeToEnterprise,
  ExportPartialToEnterpriseFn,
  ExportTypedToEnterpriseFn,
  FormElementType,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "./types"

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

  for (const [key, rule] of Object.entries(rules.properties)) {
    const value = (data as any)[key]

    if (value === undefined) continue

    const yamlKey = rule.yaml

    const typeExportFn = getTypeRule(rule.type, "exportToEnterprise")

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

  for (const [key, rule] of Object.entries(rules.properties)) {
    const value = (data as any)[key]

    if (value === undefined) continue

    const yamlKey = (rule.yaml ?? key.charAt(0).toUpperCase() + key.slice(1)) as string

    // Try to get type-specific export function
    const typeExportFn = getTypeRule(rule.type, "exportToEnterprise")

    if (typeExportFn) {
      // Check if function expects additional parameters (like UserVisible)
      const exportedValue = (typeExportFn as any)(context, rule, value)
      if (exportedValue !== undefined) {
        result[yamlKey] = exportedValue
      }
    } else if (typeof value !== "object" || value === null) {
      // Simple value
      result[yamlKey] = value
    }
  }

  return result as ToPartialEnterpriseType<T>
}

export type { ExportPartialToEnterpriseFn, ExportTypedToEnterpriseFn }
