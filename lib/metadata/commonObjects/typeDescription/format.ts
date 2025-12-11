import { TypeDescription } from "./types"

export const formatTypeDescription = (typeDescription: TypeDescription | undefined): string | undefined => {
  if (!typeDescription) {
    return undefined
  }

  if (typeDescription.type.length > 1) {
    return typeDescription.type.map((type) => formatSingleType(type, typeDescription)).join(", ")
  }

  return formatSingleType(typeDescription.type[0], typeDescription)
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
    return `НеотрицательноеЧисло(${digits}, ${fractionDigits})`
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
  const typeMap: Record<string, string> = {
    string: "Строка",
    number: "Число",
    date: "Дата",
  }

  if (type === "string" && typeDescription.stringQualifiers) {
    return formatStringQualifier(typeDescription.stringQualifiers)
  }

  if (type === "number" && typeDescription.numberQualifiers) {
    return formatNumberQualifier(typeDescription.numberQualifiers)
  }

  if (type === "date" && typeDescription.dateQualifiers) {
    return formatDateQualifier(typeDescription.dateQualifiers)
  }

  return typeMap[type] || type
}
