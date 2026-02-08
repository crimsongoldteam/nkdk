import context from "antd/es/app/context"
import { importUserVisibleFromYAML } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { UserVisible } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement, NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { ElementRule, getElementRule, PropertyRule } from "../elementRulesFactory"
import { getTypeRule } from "../typeRulesFactory"
import {
  FormElementType,
  importFormElementTypeFromEnterprise,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "../types"

export function importElementFromTypedYAML<T extends NamedElement>(params: {
  context: ConfigurationContext
  data: ToTypedEnterpriseType<T> | undefined
  name: string
}): T | undefined {
  if (params.data === undefined) return undefined

  const elementType = importFormElementTypeFromEnterprise(params.context, params.data.Тип)

  const rules = getElementRule<T>(elementType)

  const result: any = {
    elementType: elementType,
    name: params.name,
  }

  for (const [key, rule] of Object.entries(rules.properties) as [keyof T, PropertyRule<T>][]) {
    const yamlKey = rule.yaml as keyof typeof params.data

    const yamlValue = params.data[yamlKey]

    const userVisible = importUserVisibleProperty(params.context, rule, params.data)
    if (userVisible !== undefined) {
      ;(result[key] as UserVisible) = userVisible
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

export function importElementFromPartialYAML<T extends BaseElement>(params: {
  context: ConfigurationContext
  elementType: FormElementType
  yaml: ToPartialEnterpriseType<T> | undefined
  source?: T
}): T | undefined {
  if (params.yaml === undefined) return params.source

  const rules = getElementRule<T>(params.elementType)

  return importElementFromYAML({
    context: params.context,
    rules: rules,
    yaml: params.yaml,
    source: params.source,
  })
}

export function importElementFromYAML<T extends BaseElement>(params: {
  context: ConfigurationContext
  rules: ElementRule<T>
  yaml: ToPartialEnterpriseType<T> | undefined
  source?: T
}): T | undefined {
  const { context, rules, yaml, source } = params
  if (yaml === undefined) return source

  const result: T = {
    ...(source ? source : {}),
  } as T

  for (const [key, curRule] of Object.entries(rules.properties) as [keyof T, PropertyRule<T>][]) {
    const yamlKey = curRule.yaml
    if (yamlKey === undefined) continue

    const sourceValue = source ? source[key] : curRule.defaultValue

    const userVisible = importUserVisibleProperty(context, curRule, yaml)
    if (userVisible !== undefined) {
      ;(result[key] as UserVisible) = userVisible
      continue
    }

    const yamlValue = (yaml as any)[yamlKey]

    const typeImportFn = getTypeRule(curRule.type!, "importFromEnterprise")
    if (typeImportFn) {
      const importedValue = (typeImportFn as any)(context, curRule, yamlValue, sourceValue)
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

function importUserVisibleProperty(
  context: ConfigurationContext,
  rule: PropertyRule<any>,
  yaml: any
): UserVisible | undefined {
  if (rule.type !== "UserVisible") return undefined
  const yamlValue = yaml[rule.yaml!]
  const yamlValueDeny = yaml[rule.yamlDeny!]
  return importUserVisibleFromYAML(context, rule, yamlValue, yamlValueDeny)
}
