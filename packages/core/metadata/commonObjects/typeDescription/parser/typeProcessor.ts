import { cleanString } from "~/helpers/cleanString"
import { AllowedLength } from "~/metadata/systemEnumerations/types"
import {
  AppliedTypeFromEnterprise,
  AppliedTypeToEnterprise,
  PrimitiveTypeFromEnterprise,
  PrimitiveTypeToEnterprise,
  TypeDescription,
} from "../types"

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

    let aliase = getAliase(type, value)

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
      Число: "decimal",
      Строка: "string",
      Дата: "dateTime",
      Булево: "boolean",
    }

    const baseType = baseTypeMap[aliase]

    // Если это базовый тип, используем английское название
    if (baseType) {
      result.type.push(baseType)
    } else if (kind) {
      // Для прикладных объектов преобразуем русское название в английский префикс
      const appliedTypePrefix = getAppliedTypePrefix(aliase)
      if (appliedTypePrefix) {
        result.type.push(`${appliedTypePrefix}.${kind}`)
      } else {
        result.type.push(`${aliase}.${kind}`)
      }
    } else {
      result.type.push(aliase)
    }

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

const getAliase = (type: string, originalValue: string): string | undefined => {
  const originalValueLower = originalValue.toLowerCase()
  const typeLower = type.toLowerCase()

  if (originalValueLower.startsWith("строка") || originalValueLower.startsWith("фиксированнаястрока")) {
    return "Строка"
  }
  if (originalValueLower.startsWith("число") || originalValueLower.startsWith("положительноечисло")) {
    return "Число"
  }
  if (["дата", "время", "датавремя"].includes(originalValueLower)) {
    return "Дата"
  }
  if (originalValueLower === "булево") {
    return "Булево"
  }
  if (["определенныйтип", "определяемыйтип"].includes(typeLower)) {
    return "ОпределяемыйТип"
  }

  const appliedType = AppliedTypeFromEnterprise(type)
  if (appliedType) {
    return AppliedTypeToEnterprise[appliedType]
  }

  const primitiveType = PrimitiveTypeFromEnterprise(type)
  if (primitiveType) {
    return PrimitiveTypeToEnterprise[primitiveType]
  }

  return undefined
}

const getAppliedTypePrefix = (enterpriseName: string): string | undefined => {
  // Преобразуем русское название прикладного объекта в английский префикс
  // Используем AppliedTypeToEnterprise для обратного преобразования
  // При наличии нескольких вариантов (например, Catalog и CatalogRef) выбираем Ref версию

  const matchingKeys: string[] = []

  // Находим все ключи, которые соответствуют данному русскому названию
  for (const [key, value] of Object.entries(AppliedTypeToEnterprise)) {
    if (value === enterpriseName) {
      matchingKeys.push(key)
    }
  }

  if (matchingKeys.length === 0) {
    return undefined
  }

  // Если есть версия с Ref, выбираем её, иначе первый найденный ключ
  const refKey = matchingKeys.find((key) => key.endsWith("Ref"))
  return refKey || matchingKeys[0]
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
