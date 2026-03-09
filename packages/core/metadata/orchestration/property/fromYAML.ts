import { ConfigurationContext } from "~/metadata/context/types"
import { MetadataItemType, ToMetadata, ToYAML } from "~/metadata/orchestration/metadataItem/registry"
import { getTypeRule } from "../formElement/factory"
import { importFromYAMLFunction, importFromYAMLFunctionNew } from "./fn"
import { getValueOrDefault } from "./helpers"
import { MetadataItemRule, PropertyRule } from "./types"

export function importPropertiesFromYAML<Rule extends MetadataItemRule>(params: {
  context: ConfigurationContext
  yaml: ToYAML<Rule["itemType"]> | undefined
  metadataRule: Rule
  source?: ToMetadata<Rule["itemType"]>
  name?: string
}): ToMetadata<Rule["itemType"]> {
  const { context, yaml, source, metadataRule: metadataRule, name } = params
  const metadataType = metadataRule.itemType

  const result = {
    itemType: metadataType,
  } as ToMetadata<Rule["itemType"]>

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
    keyof ToMetadata<Rule["itemType"]>,
    PropertyRule,
  ][]) {
    const yamlKey = curRule.yaml as keyof ToYAML<Rule["itemType"]>
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

  const typeimportFn = rule.type ? getTypeRule(rule.type, "importFromYAML") : undefined

  if (!typeimportFn) {
    return getValueOrDefault({
      context,
      rule,
      value: value ?? sourceValue,
      name,
      operation: "importFromYAML",
    })
  }

  if (typeimportFn.length === 1) {
    const importedValue = (typeimportFn as importFromYAMLFunctionNew)({
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

  const result = (typeimportFn as importFromYAMLFunction)(context, rule, value, sourceValue)

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
  yaml: ToYAML<Type> | undefined
  metadataRule: MetadataItemRule
  result: ToMetadata<Type>
  name?: string
}): ToMetadata<Type> | undefined {
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
  } as ToMetadata<Type>

  return importPropertiesFromYAML({
    context,
    metadataRule: metadataRule,
    name,
    source: source,
    yaml: {},
  })
}
