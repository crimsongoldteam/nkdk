import { importFormattedI8nTextFromEnterprise } from "~/metadata/commonObjects/formattedI8nText/importFromEnterprise"
import { importUserVisibleFromYAML } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement, NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { ElementRule, getElementRule } from "../elementRulesFactory"
import { importFormElementTypeFromEnterprise } from "../metadataType/fromYAML"
import { FormElementType } from "../metadataType/types"
import { PropertyRule } from "../properties/types"
import { ToTypedYAML, ToYAML } from "../rules"
import { getTypeRule } from "../typeRulesFactory"

export const importPropertyFromEnterprise = (params: {
  context: ConfigurationContext
  rule: PropertyRule<any>
  value: any
  yaml?: any
  sourceValue?: any
}): any => {
  const { context, rule, value, sourceValue, yaml } = params

  if (yaml && rule.type === "UserVisible") {
    const yamlValueDeny = yaml[rule.yamlDeny]
    return importUserVisibleFromYAML(context, rule, value, yamlValueDeny)
  }

  if (yaml && rule.type === "FormattedI8nText") {
    const yamlFormatted = yaml[rule.yamlFormatted]
    return importFormattedI8nTextFromEnterprise(context, rule, value, yamlFormatted)
  }

  const typeImportFn = rule.type ? getTypeRule(rule.type, "importFromEnterprise") : undefined

  if (!typeImportFn) {
    return value ?? sourceValue
  }

  const result = typeImportFn(context, rule, value, sourceValue)

  return result ?? sourceValue
}

export function importElementFromTypedYAML<T extends NamedElement>(params: {
  context: ConfigurationContext
  yaml: ToTypedYAML<T> & { События?: Record<string, string> }
  name: string
}): T {
  const { context, yaml: yaml, name } = params

  const itemType = importFormElementTypeFromEnterprise(params.context, yaml.Тип)

  const rules = getElementRule<T>(itemType)

  const result: any = {
    itemType: itemType,
    name: name,
  }

  for (const [key, rule] of Object.entries(rules.properties) as [keyof T, PropertyRule<T>][]) {
    const yamlKey = rule.yaml as keyof typeof params.yaml

    const yamlValue = yaml[yamlKey]

    const importedValue = importPropertyFromEnterprise({
      context,
      rule: rule,
      yaml: yaml,
      value: yamlValue,
    })

    if (importedValue !== undefined) {
      result[key as keyof T] = importedValue
    }
  }

  const events = importEventsFromYAML(rules.events, "События" in yaml ? yaml.События : undefined)
  Object.assign(result, events)

  return result as T
}

export function importElementFromPartialYAML<T extends BaseElement>(params: {
  context: ConfigurationContext
  itemType: FormElementType
  yaml: ToYAML<T> | undefined
  source?: T
}): T | undefined {
  if (params.yaml === undefined) return params.source

  const rules = getElementRule<T>(params.itemType)

  return importElementFromYAML({
    context: params.context,
    rules: rules,
    yaml: params.yaml as ToYAML<T> & { События?: Record<string, string> },
    itemType: params.itemType,
    source: params.source,
  })
}

export function importElementFromYAML<T extends BaseElement>(params: {
  context: ConfigurationContext
  rules: ElementRule<T>
  itemType: FormElementType
  yaml: (ToYAML<T> & { События?: Record<string, string> }) | undefined
  source?: T
}): T | undefined {
  const { context, rules, yaml, source, itemType } = params
  if (yaml === undefined) return source

  const result: T = {
    ...(source ? source : {}),
    itemType: itemType,
  } as T

  for (const [key, curRule] of Object.entries(rules.properties) as [keyof T, PropertyRule<T>][]) {
    const yamlKey = curRule.yaml
    if (yamlKey === undefined) continue

    const sourceValue = source ? source[key] : curRule.defaultValue

    const yamlValue = (yaml as any)[yamlKey]

    const importedValue = importPropertyFromEnterprise({
      context,
      rule: curRule,
      value: yamlValue,
      yaml: yaml,
      sourceValue,
    })

    if (importedValue !== undefined) {
      result[key as keyof T] = importedValue
    }
  }

  const events = importEventsFromYAML(rules.events, "События" in yaml ? yaml.События : undefined)
  Object.assign(result, events)

  return result
}

const importEventsFromYAML = (
  rules: Record<string, string> | undefined,
  yamlEvents: Record<string, string> | undefined
): { events?: Record<string, string> } => {
  if (!rules || !yamlEvents) {
    return {}
  }

  const result: Record<string, string> = {}

  for (const [ruleKey, enterpriseName] of Object.entries(rules)) {
    const eventValue = yamlEvents[enterpriseName]
    if (eventValue === undefined) continue

    result[ruleKey] = eventValue
  }

  return { events: result }
}
