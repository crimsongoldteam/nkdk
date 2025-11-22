import { cleanString } from "~/lib/helpers/cleanString"
import { TAllowedLength } from "~/lib/metadata/systemEnumerations/types"
import { TTypeDescription } from "../types"

export const visitTypeProcessor = (types: any): TTypeDescription => {
  const result: TTypeDescription = {
    type: [],
    stringQualifiers: undefined,
    numberQualifiers: undefined,
    dateQualifiers: undefined,
  }

  for (let typeInfo of types) {
    let value = typeInfo.value

    let { type, kind } = processType(value)

    let aliase = getAliase(type)
    if (!aliase) continue

    if (kind) {
      kind = cleanString(kind)
      if (kind === "") continue
    }

    const resultType = kind ? `${aliase}.${kind}` : aliase

    result.type.push(resultType)

    const processor = getTypeProcessor(type)
    if (processor) {
      processor(result, typeInfo)
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

const processNumberType = (result: TTypeDescription, typeInfo: any): void => {
  let options = typeInfo.options

  result.numberQualifiers = { digits: 0, fractionDigits: 0 }
  if (options && options.length > 0) {
    result.numberQualifiers!.digits = parseInt(options[0])
  }
  if (options && options.length > 1) {
    result.numberQualifiers!.fractionDigits = parseInt(options[1])
  }
}

const processStringType = (result: TTypeDescription, typeInfo: any): void => {
  let options = typeInfo.options
  result.stringQualifiers = { length: 0, allowedLength: "Variable" }
  if (options && options.length > 0) {
    result.stringQualifiers.length = parseInt(options[0])
  }
  if (options && options.length > 1) {
    result.stringQualifiers.allowedLength = options[1] as TAllowedLength
  }
}

const processDateType = (_result: TTypeDescription, _typeInfo: any): void => {
  // Реализация для обработки даты, если необходимо
}

const getAliase = (type: string): string | undefined => {
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
    строка: "Строка",
    дата: "Дата",
    булево: "Булево",
  }

  return pairs[type.toLowerCase()]
}

const getTypeProcessor = (
  typeLowerCase: string
): ((result: TTypeDescription, typeInfo: any) => void) | undefined => {
  const typeProcessors: {
    [key: string]: (result: TTypeDescription, typeInfo: any) => void
  } = {
    Число: (result, typeInfo) => processNumberType(result, typeInfo),
    Строка: (result, typeInfo) => processStringType(result, typeInfo),
    Дата: (result, typeInfo) => processDateType(result, typeInfo),
  }

  return typeProcessors[typeLowerCase]
}
