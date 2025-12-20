import { cleanString } from "~/lib/helpers/cleanString"
import { AllowedLength } from "~/lib/metadata/systemEnumerations/types"
import { TypeDescription } from "../types"

export const visitTypeProcessor = (types: any): TypeDescription => {
  const result: TypeDescription = {
    type: [],
    stringQualifiers: undefined,
    numberQualifiers: undefined,
    dateQualifiers: undefined,
  }

  for (let typeInfo of types) {
    let value = typeInfo.value

    let { type, kind } = processType(value)

    let aliase = getAliase(type)

    // Если нет алиаса, значит это произвольный тип (например, "тип1", "тип2")
    if (!aliase) {
      result.type.push(value)
      continue
    }

    if (kind) {
      kind = cleanString(kind)
      if (kind === "") continue
    }

    // Для базовых типов используем английские названия
    const baseTypeMap: Record<string, string> = {
      Число: "number",
      Строка: "string",
      Дата: "date",
    }

    const baseType = baseTypeMap[aliase]

    // Если это базовый тип, используем английское название, иначе используем алиас с kind
    const resultType = baseType ? baseType : kind ? `${aliase}.${kind}` : aliase

    result.type.push(resultType)

    const processor = getTypeProcessor(aliase)
    if (processor) {
      processor(result, typeInfo, value)
    }
  }

  return result
}

const processType = (
  type: string
): {
  type: string
  kind: string | undefined
} => {
  const parts = type.split(".")

  if (parts.length === 2) {
    const baseType = parts[0]
    const kind = parts[1]

    return { type: baseType, kind: kind }
  }

  return { type: type, kind: undefined }
}

const processNumberType = (result: TypeDescription, typeInfo: any, originalValue: string): void => {
  let options = typeInfo.options

  result.numberQualifiers = { digits: 0, fractionDigits: 0 }
  if (options && options.length > 0) {
    result.numberQualifiers!.digits = parseInt(options[0])
  }
  if (options && options.length > 1) {
    result.numberQualifiers!.fractionDigits = parseInt(options[1])
  }

  // Проверяем, является ли это неотрицательным числом
  if (originalValue.toLowerCase().startsWith("положительноечисло")) {
    result.numberQualifiers!.allowedSign = "Nonnegative"
  }
}

const processStringType = (result: TypeDescription, typeInfo: any, originalValue: string): void => {
  let options = typeInfo.options
  result.stringQualifiers = { length: 0, allowedLength: "Variable" }
  if (options && options.length > 0) {
    result.stringQualifiers.length = parseInt(options[0])
  }
  if (options && options.length > 1) {
    result.stringQualifiers.allowedLength = options[1] as AllowedLength
  }

  // Проверяем, является ли это фиксированной строкой
  if (originalValue.toLowerCase().startsWith("фиксированнаястрока")) {
    result.stringQualifiers.allowedLength = "Fixed"
  }
}

const processDateType = (result: TypeDescription, _typeInfo: any, originalValue: string): void => {
  const value = originalValue?.toLowerCase()

  if (value === "время") {
    result.dateQualifiers = { dateFractions: "Time" }
  } else if (value === "датавремя") {
    result.dateQualifiers = { dateFractions: "DateTime" }
  } else {
    result.dateQualifiers = { dateFractions: "Date" }
  }
}

const getAliase = (type: string): string | undefined => {
  const typeLower = type.toLowerCase()

  const pairs: { [key: string]: string } = {
    справочник: "Справочник",
    справочники: "Справочник",
    спр: "Справочник",
    документ: "Документ",
    документы: "Документ",
    док: "Документ",
    перечисление: "Перечисление",
    перечисления: "Перечисление",
    переч: "Перечисление",
    число: "Число",
    положительноечисло: "Число",
    строка: "Строка",
    фиксированнаястрока: "Строка",
    дата: "Дата",
    время: "Дата",
    датавремя: "Дата",
    булево: "Булево",
  }

  return pairs[typeLower]
}

const getTypeProcessor = (
  typeLowerCase: string
): ((result: TypeDescription, typeInfo: any, originalValue: string) => void) | undefined => {
  const typeProcessors: {
    [key: string]: (result: TypeDescription, typeInfo: any, originalValue: string) => void
  } = {
    Число: (result, typeInfo, originalValue) => processNumberType(result, typeInfo, originalValue),
    Строка: (result, typeInfo, originalValue) => processStringType(result, typeInfo, originalValue),
    Дата: (result, typeInfo, originalValue) => processDateType(result, typeInfo, originalValue),
  }

  return typeProcessors[typeLowerCase]
}
