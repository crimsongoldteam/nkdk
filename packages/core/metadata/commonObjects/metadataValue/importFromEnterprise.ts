import { format, parse } from "date-fns"
import { Context } from "../../context/types"
import { importI8nTextFromEnterprise } from "../i8nText/importFromEnterprise.ts"
import { AppliedTypeEnterprise, AppliedTypeFromEnterprise } from "../typeDescription/types.ts"
import { MetadataFormChoiceListDesTimeValueEnterprise, MetadataValue, MetadataValueEnterprise } from "./types"
import { MetadataFixedArrayValueEnterprise } from "./types.ts"

export const importMetadataValueFromEnterprise = (
  context: Context,
  data: MetadataValueEnterprise | undefined
): MetadataValue | undefined => {
  if (data === undefined) return undefined

  if (typeof data === "object" && !Array.isArray(data) && "Представление" in data) {
    return importFormChoiceListDesTimeValueFromEnterprise(context, data as MetadataFormChoiceListDesTimeValueEnterprise)
  }

  if (Array.isArray(data)) {
    return importFixedArrayValueFromEnterprise(context, data)
  }

  if (typeof data === "number") {
    return {
      type: "decimal",
      value: data,
    }
  }

  if (typeof data === "string") {
    return importStringValueFromEnterprise(data)
  }

  throw new Error(`Invalid value ${JSON.stringify(data)}`)
}

const parseDateTime = (dateTime: string): string => {
  try {
    const date = parse(dateTime, "dd.MM.yyyy HH:mm:ss", new Date())
    if (isNaN(date.getTime())) {
      const dateOnly = parse(dateTime, "dd.MM.yyyy", new Date())
      if (!isNaN(dateOnly.getTime())) {
        return format(dateOnly, "yyyy-MM-dd'T'00:00:00")
      }
      return dateTime
    }
    return format(date, "yyyy-MM-dd'T'HH:mm:ss")
  } catch {
    return dateTime
  }
}

const importStringValueFromEnterprise = (data: string): MetadataValue => {
  // Проверяем на FormChoiceListDesTimeValue: формат "значение"(представление)
  const formChoiceListMatch = data.match(/^"([^"]+)"\(([^)]+)\)$/)
  if (formChoiceListMatch) {
    const [, value, presentation] = formChoiceListMatch
    return {
      type: "formChoiceListDesTimeValue",
      presentation: {
        items: {
          ru: presentation,
        },
      },
      value: {
        type: "string",
        value: value,
      },
    }
  }

  // Проверяем на строку в кавычках
  if (data.startsWith('"') && data.endsWith('"')) {
    const value = data.slice(1, -1)
    return {
      type: "string",
      value: value,
    }
  }

  // Проверяем на булево значение
  if (data === "Истина" || data === "Ложь") {
    return {
      type: "boolean",
      value: data === "Истина",
    }
  }

  // Проверяем на дату в формате dd.MM.yyyy HH:mm:ss или dd.MM.yyyy
  const dateTimeMatch = data.match(/^\d{2}\.\d{2}\.\d{4}(\s+\d{2}:\d{2}:\d{2})?$/)
  if (dateTimeMatch) {
    return {
      type: "dateTime",
      value: parseDateTime(data),
    }
  }

  // Проверяем на числовое значение (после проверки даты, чтобы не конфликтовать)
  if (!isNaN(Number(data)) && data.trim() !== "" && !isNaN(parseFloat(data))) {
    return {
      type: "decimal",
      value: Number(data),
    }
  }

  // Проверяем на ref (Перечисление.XXX.YYY или Справочник.XXX.ПустаяСсылка)
  const refMatch = data.match(/^(Перечисление|Справочник)\./)
  if (refMatch) {
    return importRefFromEnterprise(data)
  }

  throw new Error(`Cannot determine type for string value: ${data}`)
}

const importFixedArrayValueFromEnterprise = (
  context: Context,
  data: MetadataFixedArrayValueEnterprise
): MetadataValue => {
  return {
    type: "fixedArray",
    value: data.map((v) => importMetadataValueFromEnterprise(context, v)!) as MetadataValue[],
  }
}

const importFormChoiceListDesTimeValueFromEnterprise = (
  context: Context,
  data: MetadataFormChoiceListDesTimeValueEnterprise
): MetadataValue => {
  const value = importMetadataValueFromEnterprise(context, data.Значение)!
  return {
    type: "formChoiceListDesTimeValue",
    presentation: importI8nTextFromEnterprise(context, data.Представление),
    value: value,
  }
}

const importRefFromEnterprise = (value: string): MetadataValue => {
  const parts = value.split(".")

  const appliedTypeEnterprise = parts[0] as AppliedTypeEnterprise

  const partsResult = []

  const appliedType = AppliedTypeFromEnterprise(appliedTypeEnterprise)
  if (!appliedType) throw new Error(`Invalid type for ref: ${value}`)
  partsResult.push(appliedType)

  const objectName = parts[1]
  if (!objectName) throw new Error(`Invalid object name for ref: ${value}`)

  partsResult.push(objectName)
  if (appliedType === "Enum" && parts.length >= 3) {
    partsResult.push("EnumValue")
    partsResult.push(parts[2])
  }

  if (appliedType === "Catalog" && parts.length >= 3 && parts[2] === "ПустаяСсылка") {
    partsResult.push("EmptyRef")
  }

  return {
    type: "ref",
    value: partsResult.join("."),
  }
}
