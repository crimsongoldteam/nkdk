import { ConfigurationContext } from "~/metadata/context/types"
import { readExternalFile } from "~/metadata/forms/commonObjects/dynamicList/externalFile"
import { ToMetadata, ToYAML } from "~/metadata/orchestration/metadataItem/registry"
import { getTypeRule } from "./typeRuleRegistry"
import { importFromYAMLFunction, ImportFromYAMLFunctionNew } from "./fn"
import { getValueOrDefault, shouldProcessProperty } from "./helpers"
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

  assertMetadataItemYAMLObject({ itemType: metadataType, yaml })

  // Предварительный проход: читаем внешние файлы для свойств с опцией externalFile
  const formDir = context.importFromYAML?.formDir
  const parentName = context.importFromYAML?.parent?.name
  if (formDir !== undefined && parentName !== undefined) {
    for (const [key, propertyRule] of Object.entries(metadataRule.properties)) {
      if (!("externalFile" in propertyRule) || !propertyRule.externalFile) continue
      const content = readExternalFile(propertyRule.externalFile, parentName, formDir)
      if (content !== undefined) {
        result[key as keyof ToMetadata<Rule["itemType"]>] = content as any
      }
    }
  }

  for (const [key, curRule] of Object.entries(metadataRule.properties) as [
    keyof ToMetadata<Rule["itemType"]>,
    PropertyRule,
  ][]) {
    if (!shouldProcessProperty({ rule: curRule, operation: "importFromYAML" })) continue

    // Свойства с externalFile уже обработаны в предварительном проходе
    if ("externalFile" in curRule && curRule.externalFile) continue

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

function assertMetadataItemYAMLObject(params: { itemType: string; yaml: unknown }): void {
  const { itemType, yaml } = params
  if (yaml === undefined) return
  if (yaml !== null && typeof yaml === "object" && !Array.isArray(yaml)) return

  throw new Error(`${itemType}: ожидался YAML-объект`)
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
      yaml,
      name,
      operation: "importFromYAML",
    })
  }

  if (typeimportFn.length === 1) {
    const importedValue = (typeimportFn as ImportFromYAMLFunctionNew)({
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
      value: getImportedValueOrSourceFallback({
        rule,
        value,
        importedValue,
        sourceValue,
      }),
      yaml,
      name,
      operation: "importFromYAML",
    })
  }

  const result = (typeimportFn as importFromYAMLFunction)(context, rule, value, sourceValue)

  return getValueOrDefault({
    context,
    rule,
    value: getImportedValueOrSourceFallback({
      rule,
      value,
      importedValue: result,
      sourceValue,
    }),
    yaml,
    name,
    operation: "importFromYAML",
  })
}

const getImportedValueOrSourceFallback = (params: {
  rule: PropertyRule
  value: any
  importedValue: any
  sourceValue: any
}): any => {
  const { rule, value, importedValue, sourceValue } = params

  if (rule.type === "MetadataDcsMetadataValue" && importedValue === null) return null
  if (shouldUseOnlyImportedMetadataDcsMetadataValue({ rule, value })) return importedValue
  return importedValue ?? normalizeSourceFallbackValue(rule, sourceValue)
}

const normalizeSourceFallbackValue = (rule: PropertyRule, sourceValue: any): any => {
  if (
    rule.type === "SystemEnumeration" &&
    sourceValue !== null &&
    typeof sourceValue === "object" &&
    !Array.isArray(sourceValue)
  ) {
    const text = sourceValue["#text"]
    if (typeof text === "string") return text
  }

  return sourceValue
}

const shouldUseOnlyImportedMetadataDcsMetadataValue = (params: { rule: PropertyRule; value: any }): boolean => {
  const { rule, value } = params

  if (rule.type !== "MetadataDcsMetadataValue") return false
  if ((rule as { valueType?: unknown }).valueType !== "DesignTimeValue") return false
  return value === undefined
}
