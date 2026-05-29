import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { getSystemEnumerationYAMLType, getTypeDescriptionRule } from "./helper"
import { PrimitiveTypeToYAML, TypeDescription, TypeDescriptionYAML } from "./types"

export const exportTypeDescriptionToYAML = (
  _context: ConfigurationContext,
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

  return formatSingleType(types[0], typeDescription)
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
    (baseType === "ExternalDataSourceTableRef" || baseType === "ExternalDataSourceCubeDimensionTableRef")
  ) {
    return detailType
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

registerTypeRule("TypeDescription", "exportToYAML", exportTypeDescriptionToYAML)
