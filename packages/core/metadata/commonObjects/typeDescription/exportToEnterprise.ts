import { Context } from "../../context/types"
import { exportMetadataTypeToEnterprise } from "../metadataPath/exportToEnterprise"
import { TypeDescription, TypeDescriptionEnterprise } from "./types"

export const exportTypeDescriptionToEnterprise = (
  context: Context,
  typeDescription: TypeDescription | undefined
): TypeDescriptionEnterprise | undefined => {
  if (!typeDescription) {
    return undefined
  }

  if (typeDescription.type.length > 1) {
    return typeDescription.type.map((type) => formatSingleType(context, type, typeDescription))
  }

  return formatSingleType(context, typeDescription.type[0], typeDescription)
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

const formatSingleType = (context: Context, type: string, typeDescription: TypeDescription): string => {
  const typeMap: Record<string, string> = {
    string: "Строка",
    decimal: "Число",
    date: "Дата",
    boolean: "Булево",
  }

  if (type === "string" && typeDescription.stringQualifiers) {
    return formatStringQualifier(typeDescription.stringQualifiers)
  }

  if (type === "decimal" && typeDescription.numberQualifiers) {
    return formatNumberQualifier(typeDescription.numberQualifiers)
  }

  if ((type === "date" || type === "dateTime") && typeDescription.dateQualifiers) {
    return formatDateQualifier(typeDescription.dateQualifiers)
  }

  const metadataType = exportMetadataTypeToEnterprise(context, type)
  if (metadataType) {
    return metadataType
  }

  return typeMap[type] || type
}
