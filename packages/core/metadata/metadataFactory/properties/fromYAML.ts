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
  name?: string
}): T {
  const { context, yaml, source, rules, metadataType, name } = params

  const result: T = {
    itemType: metadataType,
  } as T

  const shortFormatResult = handleShortFormatYAML({
    context,
    yaml,
    metadataType,
    rules,
    result,
    name,
  })

  if (shortFormatResult) {
    return shortFormatResult
  }

  for (const [key, curRule] of Object.entries(rules.properties) as [keyof T, PropertyRule<T>][]) {
    const yamlKey = curRule.yaml
    if (yamlKey === undefined) continue
    if (curRule.fromYAML === false) continue

    const sourceValue = source ? source[key] : undefined

    const yamlValue = (yaml as any)[yamlKey]

    const importedValue = importPropertyFromYAML({
      context,
      rule: curRule,
      value: yamlValue,
      yaml: yaml,
      sourceValue,
      name,
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
  name?: string
}): any => {
  const { context, rule, value, sourceValue, yaml, name } = params

  const typeImportFn = rule.type ? getTypeRule(rule.type, "importFromEnterprise") : undefined

  if (!typeImportFn) {
    return getValueOrDefault({
      context,
      rule,
      value: value ?? sourceValue,
      name,
      operation: "importFromEnterprise",
    })
  }

  if (typeImportFn.length === 1) {
    const importedValue = (typeImportFn as ImportFromYAMLFunctionNew)({
      context,
      rule,
      value,
      source: sourceValue,
      yaml,
      name,
    })
    return getValueOrDefault({
      context,
      rule,
      value: importedValue ?? sourceValue,
      name,
      operation: "importFromEnterprise",
    })
  }

  const result = (typeImportFn as ImportFromEnterpriseFunction)(context, rule, value, sourceValue)

  return getValueOrDefault({
    context,
    rule,
    value: result ?? sourceValue,
    name,
    operation: "importFromEnterprise",
  })
}

function handleShortFormatYAML<T extends MetadataItem>(params: {
  context: ConfigurationContext
  yaml: ToYAML<T>
  metadataType: MetadataType
  rules: MetadataItemRule<T>
  result: T
  name?: string
}): T | undefined {
  const { context, yaml, rules, result, name, metadataType } = params

  if (typeof yaml !== "string") {
    return undefined
  }

  const shortFormatEntry = (Object.entries(rules.properties) as Array<[keyof T, PropertyRule<T>]>).find(
    ([, rule]) => rule.useAsShortValueYAML === true
  )

  if (!shortFormatEntry) {
    return undefined
  }

  const [propertyKey, shortFormatRule] = shortFormatEntry

  if (!shortFormatRule) {
    return undefined
  }

  const importedValue = importPropertyFromYAML({
    context,
    rule: shortFormatRule,
    value: yaml,
    yaml: yaml,
    name,
  })

  const source: T = {
    itemType: result.itemType,
    [propertyKey]: importedValue,
  }

  return importPropertiesFromYAML({
    context,
    rules,
    metadataType,
    name,
    source: source,
    yaml: {},
  })
}
