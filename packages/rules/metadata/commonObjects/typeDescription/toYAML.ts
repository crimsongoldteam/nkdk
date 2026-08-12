import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext, taggedYAMLScalar, xmlScalarTagValue } from "@nkdk/runtime"
import { METADATA_NAME_YAML_PATTERN } from "./allowedTypes"
import { getSystemEnumerationYAMLType, getTypeDescriptionRule, getTypePrefix } from "./helper"
import { PrimitiveTypeToYAML, TYPE_DESCRIPTION_SOURCE_TYPES, type TypeDescription, type TypeDescriptionYAML } from "./types"

const GENERATED_PREFIX_PATTERN = /^d(\d+)p1$/
const CURRENT_CONFIG_NAMESPACE = "http://v8.1c.ru/8.1/data/enterprise/current-config"

export const exportTypeDescriptionToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  typeDescription: TypeDescription | undefined
): TypeDescriptionYAML | undefined => {
  if (!typeDescription) {
    return undefined
  }

  const types = typeDescription.type

  if (types.length === 0) {
    if (typeDescription.typeId === undefined || typeDescription.typeId.length === 0) {
      return undefined
    }

    return {
      ИдентификаторТипа: typeDescription.typeId,
    }
  }

  if (types.length > 1) {
    return types.map((type) => formatSingleType(type, typeDescription))
  }

  const yamlType = formatSingleType(types[0], typeDescription)
  const sourceType = typeDescription[TYPE_DESCRIPTION_SOURCE_TYPES]?.[types[0]]
  const sourcePrefix = sourceType === undefined ? undefined : getTypePrefix(sourceType.value)
  const separator = types[0].indexOf(".")
  const baseType = separator === -1 ? types[0] : types[0].slice(0, separator)
  const typeRule = getTypeDescriptionRule(baseType)
  const canonicalPrefix = typeRule?.prefix
  if (sourcePrefix !== undefined && !isCompatibleSourcePrefix(sourcePrefix, sourceType?.namespace, typeRule)) {
    throw new Error(`Тип ${yamlType}: несовместимый XML-префикс ${sourcePrefix}`)
  }
  const contextualPrefix = typeRule?.prefix === "cfg"
    ? canonicalPredefinedItemTypePrefix(context)
    : undefined
  if (sourcePrefix !== undefined && sourcePrefix === contextualPrefix) return yamlType
  if (sourcePrefix !== undefined && sourcePrefix !== canonicalPrefix) {
    return taggedYAMLScalar("xml", xmlScalarTagValue(`${sourcePrefix}:${yamlType}`)) as unknown as TypeDescriptionYAML
  }
  return yamlType
}

function canonicalPredefinedItemTypePrefix(
  context: ConfigurationContext,
): string | undefined {
  const itemTypes = context.exportToYAML?.metadataItemTypes
  if (itemTypes === undefined) return undefined
  let depth = 0
  for (let index = itemTypes.length - 1; itemTypes[index] === "PredefinedItem"; index--) depth++
  return depth === 0 ? undefined : `d${depth * 2 + 2}p1`
}

function isCompatibleSourcePrefix(
  prefix: string,
  namespace: string | undefined,
  rule: ReturnType<typeof getTypeDescriptionRule>,
): boolean {
  if (rule === undefined) return false
  const expectedNamespace = rule.prefix === "cfg" ? CURRENT_CONFIG_NAMESPACE : rule.namespace
  if (prefix === rule.prefix) return namespace === undefined || expectedNamespace === undefined || namespace === expectedNamespace
  const generated = GENERATED_PREFIX_PATTERN.exec(prefix)
  if (generated === null || namespace !== expectedNamespace) return false
  const number = Number(generated[1])
  return rule.prefix === "cfg" ? number % 2 === 0 : rule.namespace !== undefined && number % 2 === 1
}

const formatStringQualifier = (stringQualifiers: NonNullable<TypeDescription["stringQualifiers"]>): string => {
  const { length, allowedLength } = stringQualifiers

  if (allowedLength === "Fixed") {
    return `ФиксированнаяСтрока(${length})`
  }

  if (length === 0) {
    return "Строка"
  }

  return `Строка(${length})`
}

const formatNumberQualifier = (numberQualifiers: NonNullable<TypeDescription["numberQualifiers"]>): string => {
  const { digits, fractionDigits, allowedSign } = numberQualifiers

  if (allowedSign === "Nonnegative") {
    return `ПоложительноеЧисло(${digits}, ${fractionDigits})`
  }

  return `Число(${digits}, ${fractionDigits})`
}

const formatDateQualifier = (dateQualifiers: NonNullable<TypeDescription["dateQualifiers"]>): string => {
  const { dateFractions } = dateQualifiers

  switch (dateFractions) {
    case "Time":
      return "Время"
    case "DateTime":
      return "ДатаВремя"
    case "Date":
    default:
      return "Дата"
  }
}

const externalDataSourceTablePattern = new RegExp(
  `^ВнешнийИсточникДанных${METADATA_NAME_YAML_PATTERN}\\.Таблица${METADATA_NAME_YAML_PATTERN}$`
)
const externalDataSourceCubeDimensionTablePattern = new RegExp(
  `^ВнешнийИсточникДанных${METADATA_NAME_YAML_PATTERN}\\.Куб${METADATA_NAME_YAML_PATTERN}\\.ТаблицаИзмерения${METADATA_NAME_YAML_PATTERN}$`
)

const isExternalDataSourceTableYAMLType = (type: string): boolean => externalDataSourceTablePattern.test(type)

const isExternalDataSourceCubeDimensionTableYAMLType = (type: string): boolean =>
  externalDataSourceCubeDimensionTablePattern.test(type)

const isExternalDataSourceBaseType = (type: string): boolean =>
  type === "ExternalDataSourceTableRef" || type === "ExternalDataSourceCubeDimensionTableRef"

const formatSingleType = (type: string, typeDescription: TypeDescription): string => {
  if (type === "string") {
    if (typeDescription.stringQualifiers) {
      return formatStringQualifier(typeDescription.stringQualifiers)
    }
    return PrimitiveTypeToYAML.string
  }

  if (type === "decimal") {
    if (typeDescription.numberQualifiers) {
      return formatNumberQualifier(typeDescription.numberQualifiers)
    }
    return PrimitiveTypeToYAML.decimal
  }

  if (type === "date" || type === "dateTime") {
    if (typeDescription.dateQualifiers) {
      return formatDateQualifier(typeDescription.dateQualifiers)
    }
    return PrimitiveTypeToYAML.date
  }

  if (type === "boolean") {
    return PrimitiveTypeToYAML.boolean
  }

  const dotIndex = type.indexOf(".")
  const isComplex = dotIndex !== -1
  const baseType = isComplex ? type.substring(0, dotIndex) : type
  const detailType = isComplex ? type.substring(dotIndex + 1) : undefined

  const rule = getTypeDescriptionRule(baseType)
  if (
    detailType !== undefined &&
    baseType === "ExternalDataSourceTableRef" &&
    isExternalDataSourceTableYAMLType(detailType)
  ) {
    return detailType
  }

  if (
    detailType !== undefined &&
    baseType === "ExternalDataSourceCubeDimensionTableRef" &&
    isExternalDataSourceCubeDimensionTableYAMLType(detailType)
  ) {
    return detailType
  }

  if (isExternalDataSourceBaseType(baseType) && detailType !== undefined) {
    throw new Error(`Type ${type} not found in TypeDescriptionRules`)
  }

  if (!rule) {
    if (!isComplex) {
      const systemEnumerationYAMLType = getSystemEnumerationYAMLType(baseType)
      if (systemEnumerationYAMLType !== undefined) {
        return systemEnumerationYAMLType
      }
    }

    throw new Error(`Type ${type} not found in TypeDescriptionRules`)
  }

  if (isComplex) {
    return `${rule.enterprise}.${detailType}`
  }

  return rule.enterprise
}

export const metadataPropertyRule000 = definePropertyTypeRule("TypeDescription", "exportToYAML", exportTypeDescriptionToYAML)
