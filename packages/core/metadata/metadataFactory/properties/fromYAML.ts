import { ConfigurationContext } from "~/metadata/context/types"
import { MetadataItemType } from "~/metadata/orchestration/metadataItem/registry"
import { ToYAML } from ".."
import { ImportFromYAMLFunction, ImportFromYAMLFunctionNew } from "../../orchestration/property/fn"
import { MetadataItem, MetadataItemRule, PropertyRule } from "../../orchestration/property/types"
import { getTypeRule } from "../types/factory"
import { getValueOrDefault } from "./helpers"

export function importPropertiesFromYAML<T extends MetadataItem>(params: {
  context: ConfigurationContext
  yaml: ToYAML<T>
  metadataType: MetadataItemType
  rules: MetadataItemRule
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

  for (const [key, curRule] of Object.entries(rules.properties) as [keyof T, PropertyRule][]) {
    const yamlKey = curRule.yaml
    // if (yamlKey === undefined) continue
    if (curRule.fromYAML === false) continue

    const sourceValue = source ? source[key] : undefined

    const yamlValue = yaml && yamlKey ? (yaml as any)[yamlKey] : undefined

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
  rule: PropertyRule
  value: any
  yaml?: any
  sourceValue?: any
  name?: string
}): any => {
  const { context, rule, value, sourceValue, yaml, name } = params

  const typeImportFn = rule.type ? getTypeRule(rule.type, "importFromYAML") : undefined

  if (!typeImportFn) {
    return getValueOrDefault({
      context,
      rule,
      value: value ?? sourceValue,
      name,
      operation: "importFromYAML",
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
      operation: "importFromYAML",
    })
  }

  const result = (typeImportFn as ImportFromYAMLFunction)(context, rule, value, sourceValue)

  return getValueOrDefault({
    context,
    rule,
    value: result ?? sourceValue,
    name,
    operation: "importFromYAML",
  })
}

function handleShortFormatYAML<T extends MetadataItem>(params: {
  context: ConfigurationContext
  yaml: ToYAML<T>
  metadataType: MetadataItemType
  rules: MetadataItemRule
  result: T
  name?: string
}): T | undefined {
  const { context, yaml, rules, result, name, metadataType } = params

  if (typeof yaml !== "string") {
    return undefined
  }

  const shortFormatEntry = (Object.entries(rules.properties) as Array<[keyof T, PropertyRule]>).find(
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
  } as T

  return importPropertiesFromYAML({
    context,
    rules,
    metadataType,
    name,
    source: source,
    yaml: {} as ToYAML<T>,
  })
}
