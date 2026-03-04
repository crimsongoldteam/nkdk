import { ConfigurationContext } from "~/metadata/context/types"
import {
  MetadataItemType,
  MetadataItemTypeToMdItem,
  MetadataItemTypeToYAML,
} from "~/metadata/orchestration/metadataItem/registry"
import { getTypeRule } from "../formElement/factory"
import { ImportFromYAMLFunction, ImportFromYAMLFunctionNew } from "./fn"
import { getValueOrDefault } from "./helpers"
import { MetadataItemRule, PropertyRule } from "./types"

export function importPropertiesFromYAML<Rule extends MetadataItemRule>(params: {
  context: ConfigurationContext
  yaml: MetadataItemTypeToYAML<Rule["itemType"]>
  // metadataType: Type
  rules: Rule
  source?: MetadataItemTypeToMdItem<Rule["itemType"]>
  name?: string
}): MetadataItemTypeToMdItem<Rule["itemType"]> {
  const { context, yaml, source, rules, name } = params
  const metadataType = rules.itemType

  const result: MetadataItemTypeToMdItem<Rule["itemType"]> = {
    itemType: metadataType,
  }

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

  for (const [key, curRule] of Object.entries(rules.properties)) {
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
      result[key] = importedValue
    }
  }

  return result
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

function handleShortFormatYAML<Type extends MetadataItemType>(params: {
  context: ConfigurationContext
  yaml: MetadataItemTypeToYAML<Type>
  metadataType: Type
  rules: MetadataItemRule
  result: MetadataItemTypeToMdItem<Type>
  name?: string
}): MetadataItemTypeToMdItem<Type> | undefined {
  const { context, yaml, rules, result, name, metadataType } = params

  if (typeof yaml !== "string") {
    return undefined
  }

  const shortFormatEntry = Object.entries(rules.properties).find(([, rule]) => rule.useAsShortValueYAML === true)

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

  const source: MetadataItemTypeToMdItem<Type> = {
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
