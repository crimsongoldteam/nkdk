import { ConfigurationContext } from "~/metadata/context/types"
import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { getElementRule, PropertyRule } from "../elementRulesFactory"
import { getTypeRule } from "../typeRulesFactory"
import { FormElementType, ToPartialEnterpriseType, ToTypedEnterpriseType } from "../types"

export function importElementFromEnterpriseTyped<T extends NamedElement>(
  context: ConfigurationContext,
  elementType: FormElementType,
  data: ToTypedEnterpriseType<T> | undefined,
  name: string
): T | undefined {
  if (data === undefined) return undefined

  const rules = getElementRule<T>(elementType)

  const result: any = {
    elementType: elementType as any,
    name,
  }

  for (const [key, rule] of Object.entries(rules.properties) as [string, PropertyRule][]) {
    const yamlKey = rule.yaml

    const xmlValue = data[yamlKey as keyof typeof data]

    if (xmlValue === undefined) continue

    const typeImportFn = getTypeRule(rule.type as any, "importFromEnterprise")

    if (typeImportFn) {
      const importedValue = (typeImportFn as any)(context, rule, xmlValue)
      if (importedValue !== undefined) {
        result[key] = importedValue
      }
    } else {
      result[key] = xmlValue
    }
  }

  return result as T
}

export function importElementFromEnterprisePartial<T extends NamedElement>(
  context: ConfigurationContext,
  elementType: FormElementType,
  source: T,
  data: ToPartialEnterpriseType<T> | undefined
): T {
  if (data === undefined) return source

  const rules = getElementRule<T>(elementType)

  const result: T = {
    ...source,
  }

  for (const [key, rule] of Object.entries(rules.properties) as [string, PropertyRule][]) {
    if (!rule.toEnterprise) continue

    const yamlKey = rule.yaml as keyof typeof data

    const xmlValue = data[yamlKey]

    if (xmlValue === undefined) continue

    const typeImportFn = getTypeRule(rule.type as any, "importFromEnterprise")

    if (typeImportFn) {
      const importedValue = (typeImportFn as any)(context, rule, xmlValue)
      if (importedValue !== undefined) {
        result[key as keyof T] = importedValue
      }
    } else {
      ;(result as any)[key] = xmlValue
    }
  }

  return result
}
