import { ConfigurationContext } from "~/metadata/context/types"
import { ToYAML } from ".."
import { MetadataType } from "../metadataType/types"
import { getTypeRule } from "../types/factory"
import { ImportFromEnterpriseFunction, ImportFromYAMLFunctionNew } from "../types/types"
import { getValueOrDefault } from "./helpers"
import { MetadataItem, MetadataItemRule, PropertyRule } from "./types"

export function importPropertiesFromYAML<T extends MetadataItem>(params: {
  context: ConfigurationContext
  yaml: ToYAML<T>
  metadataType: MetadataType
  rules: MetadataItemRule<T>
  source?: T
}): T {
  const { context, yaml, source, rules, metadataType } = params

  const result: T = {
    itemType: metadataType,
  } as T

  for (const [key, curRule] of Object.entries(rules.properties) as [keyof T, PropertyRule<T>][]) {
    const yamlKey = curRule.yaml
    if (yamlKey === undefined) continue

    const sourceValue = source ? source[key] : undefined

    const yamlValue = (yaml as any)[yamlKey]

    const importedValue = importPropertyFromYAML({
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

  return result as T
}

export const importPropertyFromYAML = (params: {
  context: ConfigurationContext
  rule: PropertyRule<any>
  value: any
  yaml?: any
  sourceValue?: any
}): any => {
  const { context, rule, value, sourceValue, yaml } = params

  const typeImportFn = rule.type ? getTypeRule(rule.type, "importFromEnterprise") : undefined

  if (!typeImportFn) {
    return getValueOrDefault(context, rule, value ?? sourceValue)
  }

  if (typeImportFn.length === 1) {
    const importedValue = (typeImportFn as ImportFromYAMLFunctionNew)({
      context,
      rule,
      value,
      source: sourceValue,
      yaml,
    })
    return getValueOrDefault(context, rule, importedValue ?? sourceValue)
  }

  const result = (typeImportFn as ImportFromEnterpriseFunction)(context, rule, value, sourceValue)

  return getValueOrDefault(context, rule, result ?? sourceValue)
}
