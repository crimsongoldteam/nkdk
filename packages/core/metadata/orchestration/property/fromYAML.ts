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
  yaml: MetadataItemTypeToYAML<Rule["itemType"]> | undefined
  // metadataType: Type
  metadataRule: Rule
  source?: MetadataItemTypeToMdItem<Rule["itemType"]>
  name?: string
}): MetadataItemTypeToMdItem<Rule["itemType"]> {
  const { context, yaml, source, metadataRule: metadataRule, name } = params
  const metadataType = metadataRule.itemType

  const result = {
    itemType: metadataType,
  } as MetadataItemTypeToMdItem<Rule["itemType"]>

  const shortFormatResult = handleShortFormatYAML({
    context,
    yaml,
    metadataRule,
    result,
    name,
  })

  if (shortFormatResult) {
    return shortFormatResult
  }

  for (const [key, curRule] of Object.entries(metadataRule.properties) as [
    keyof MetadataItemTypeToMdItem<Rule["itemType"]>,
    PropertyRule,
  ][]) {
    const yamlKey = curRule.yaml as keyof MetadataItemTypeToYAML<Rule["itemType"]>
    // if (yamlKey === undefined) continue
    if (curRule.fromYAML === false) continue

    const sourceValue = source ? source[key] : undefined

    const yamlValue = yaml && yamlKey ? yaml[yamlKey] : undefined

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
  yaml: MetadataItemTypeToYAML<Type> | undefined
  metadataRule: MetadataItemRule
  result: MetadataItemTypeToMdItem<Type>
  name?: string
}): MetadataItemTypeToMdItem<Type> | undefined {
  const { context, yaml, metadataRule: metadataRule, result, name } = params

  if (typeof yaml !== "string") {
    return undefined
  }

  const shortFormatEntry = Object.entries(metadataRule.properties).find(([, rule]) => rule.useAsShortValueYAML === true)

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

  const source = {
    itemType: result.itemType,
    [propertyKey]: importedValue,
  } as MetadataItemTypeToMdItem<Type>

  return importPropertiesFromYAML({
    context,
    metadataRule: metadataRule,
    name,
    source: source,
    yaml: {},
  })
}
