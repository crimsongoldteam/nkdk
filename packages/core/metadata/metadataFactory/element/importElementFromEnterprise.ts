import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { importUserVisibleFromYAML } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement, NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { ElementRule, getElementRule, PropertyRule } from "../elementRulesFactory"
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

    const yamlValue = data[yamlKey as keyof typeof data]

    if (rule.type === "UserVisible") {
      const yamlValueDeny = data[rule.yamlDeny as keyof typeof data]

      const importedValue = importUserVisibleFromYAML(
        context,
        rule,
        yamlValue as Record<string, StringboolEnterprise> | undefined,
        yamlValueDeny as Record<string, StringboolEnterprise> | undefined
      )
      if (importedValue !== undefined) {
        result[key] = importedValue
      }
      continue
    }

    const typeImportFn = getTypeRule(rule.type as any, "importFromEnterprise")

    if (typeImportFn) {
      const importedValue = (typeImportFn as any)(context, rule, yamlValue)
      if (importedValue !== undefined) {
        result[key] = importedValue
      }
    } else {
      result[key] = yamlValue
    }
  }

  return result as T
}

export function importSingleElementFromEnterprise<T extends BaseElement>(
  context: ConfigurationContext,
  source: T,
  data: ToPartialEnterpriseType<T> | undefined,
  params: {
    rules: ElementRule<T>
  }
): T | undefined {
  return importFromEnterprisePartial(context, params.rules, data, source)
}

export function importElementFromEnterprisePartial<T extends BaseElement>(
  context: ConfigurationContext,
  elementType: FormElementType,
  data: ToPartialEnterpriseType<T> | undefined,
  source?: T
): T | undefined {
  if (data === undefined) return source

  const rules = getElementRule<T>(elementType)

  return importFromEnterprisePartial(context, rules, data, source)
}

export function importFromEnterprisePartial<T extends BaseElement>(
  context: ConfigurationContext,
  rules: ElementRule<T>,
  data: ToPartialEnterpriseType<T> | undefined,
  source?: T
): T | undefined {
  if (data === undefined) return source

  const result = {
    ...(source ? source : {}),
  } as T

  for (const [key, rule] of Object.entries(rules.properties) as [string, PropertyRule][]) {
    const yamlKey = rule.yaml as keyof typeof data

    const yamlValue = data[yamlKey]
    const sourceValue = source ? source[key as keyof T] : rule.defaultValue

    if (rule.type === "UserVisible") {
      const yamlValueDeny = data[rule.yamlDeny as keyof typeof data]

      const importedValue = importUserVisibleFromYAML(
        context,
        rule,
        yamlValue as Record<string, StringboolEnterprise> | undefined,
        yamlValueDeny as Record<string, StringboolEnterprise> | undefined
      )
      if (importedValue !== undefined) {
        ;(result as Record<string, unknown>)[key] = importedValue
      }
      continue
    }

    const typeImportFn = getTypeRule(rule.type as any, "importFromEnterprise")
    if (typeImportFn) {
      const importedValue = (typeImportFn as any)(context, rule, yamlValue, sourceValue)
      if (importedValue !== undefined) {
        result[key as keyof T] = importedValue
      }
      continue
    }

    if (yamlValue === undefined) continue
    ;(result as any)[key] = yamlValue
  }

  return result
}
