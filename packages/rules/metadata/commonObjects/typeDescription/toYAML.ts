import type { PropertyRule, ExportToYAMLFunctionNew } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext, type XmlAnomalyAnnotations } from "@nkdk/runtime"
import { incompatibleTypeDescriptionIndices, METADATA_NAME_YAML_PATTERN } from "./allowedTypes"
import {
  getSystemEnumerationYAMLType,
  getTypeDescriptionRule,
} from "./helper"
import { PrimitiveTypeToYAML, type TypeDescription, type TypeDescriptionYAML } from "./types"

export const exportTypeDescriptionToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  typeDescription: TypeDescription | undefined,
  annotations?: XmlAnomalyAnnotations,
): TypeDescriptionYAML | undefined => {
  if (!typeDescription) {
    return undefined
  }

  const exportedTypes: unknown[] = typeDescription.type.map(
    (type) => formatSingleType(type, typeDescription),
  )
  for (const typeId of typeDescription.typeId ?? []) {
    exportedTypes.push(typeId)
  }
  for (const index of incompatibleTypeDescriptionIndices(exportedTypes)) {
    annotations?.set(exportedTypes, index, { kind: "invalid", occurrence: 1, target: "value" })
  }
  if (exportedTypes.length === 0) return undefined
  if (exportedTypes.length === 1) return exportedTypes[0] as TypeDescriptionYAML

  return exportedTypes as TypeDescriptionYAML
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

const exportAnnotatedTypeDescriptionToYAML: ExportToYAMLFunctionNew = ({ context, rule, value, annotations }) =>
  exportTypeDescriptionToYAML(context, rule, value, annotations)

export const metadataPropertyRule000 = definePropertyTypeRule("TypeDescription", "exportToYAML", exportAnnotatedTypeDescriptionToYAML)
