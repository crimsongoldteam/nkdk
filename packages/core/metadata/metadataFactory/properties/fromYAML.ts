import { importFormattedI8nTextFromEnterprise } from "~/metadata/commonObjects/formattedI8nText/importFromEnterprise"
import { importUserVisibleFromYAML } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { ToYAML } from ".."
import { MetadataType } from "../metadataType/types"
import { getTypeRule } from "../types/types"
import { MetadataItem, MetadataItemRule, PropertyRule } from "./types"

export function importPropertiesFromYAML<T extends MetadataItem>(params: {
  context: ConfigurationContext
  yaml: ToYAML<T>
  metadataType: MetadataType
  rules: MetadataItemRule<T>
  source?: T
}): Partial<T> {
  const { context, yaml, source, rules } = params

  const result: T = {} as T

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
