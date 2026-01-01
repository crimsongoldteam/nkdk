import { format } from "date-fns"
import { Context as VMContext } from "vm"
import { Context } from "~/metadata/context/types"
import { exportBooleanToEnterprise } from "../boolean/exportToEnterprise"
import { exportMetadataValueStringToEnterprise as exportMetadataPathValueToEnterprise } from "../metadataPath/exportToEnterprise"
import {
  MetadataBooleanValue,
  MetadataDateTimeValue,
  MetadataDecimalValue,
  MetadataFixedArrayValue,
  MetadataFixedArrayValueEnterprise,
  MetadataFormChoiceListValue,
  MetadataObjectRefValue,
  MetadataRefValue,
  MetadataSimpleValue,
  MetadataValue,
  MetadataValueEnterprise,
} from "./types"

export const exportMetadataValueToEnterprise = (
  context: Context,
  data: MetadataValue | undefined
): MetadataValueEnterprise | undefined => {
  if (!data) return undefined

  if (data.type === "fixedArray") return exportFixedArrayValueToEnterprise(context, data)
  if (data.type === "formChoiceListDesTimeValue") return exportFormChoiceListDesTimeValueToEnterprise(context, data)
  if (data.type === "string") return exportStringValueToEnterprise(data)
  if (data.type === "decimal") return exportDecimalValueToEnterprise(data)
  if (data.type === "dateTime") return exportDateTimeValueToEnterprise(data)
  if (data.type === "boolean") return exportBooleanValueToEnterprise(context, data)
  if (data.type === "ref") return exportRefValueToEnterprise(data)
  if (data.type === "objectRef") return exportObjectRefValueToEnterprise(data)
  // if (data.type === "ApplicationUsePurpose") return exportApplicationUsePurposeValueToEnterprise(data)
  throw new Error(`Invalid type ${JSON.stringify(data)}`)
}

const formatDateTime = (dateTime: string): string => {
  const date = new Date(dateTime)
  return format(date, "dd.MM.yyyy HH:mm:ss")
}

const exportStringValueToEnterprise = (data: MetadataSimpleValue): MetadataValueEnterprise => {
  return `"${data.value as string}"`
}

const exportDecimalValueToEnterprise = (data: MetadataDecimalValue): MetadataValueEnterprise => {
  return data.value
}

const exportDateTimeValueToEnterprise = (data: MetadataDateTimeValue): MetadataValueEnterprise => {
  return formatDateTime(data.value)
}

const exportBooleanValueToEnterprise = (context: Context, data: MetadataBooleanValue): MetadataValueEnterprise => {
  return exportBooleanToEnterprise(context, data.value)!
}

const exportRefValueToEnterprise = (data: MetadataRefValue): MetadataValueEnterprise => {
  return exportMedatataRefToEnterprise(data.value)
}

const exportObjectRefValueToEnterprise = (data: MetadataObjectRefValue): MetadataValueEnterprise => {
  return exportMedatataRefToEnterprise(data.value)
}

const exportFixedArrayValueToEnterprise = (
  context: Context,
  data: MetadataFixedArrayValue
): MetadataValueEnterprise => {
  return data.value.map((v) => exportMetadataValueToEnterprise(context, v)!) as MetadataFixedArrayValueEnterprise
}

const exportFormChoiceListDesTimeValueToEnterprise = (
  context: Context,
  data: MetadataFormChoiceListValue
): MetadataValueEnterprise => {
  const valueResult = exportMetadataValueToEnterprise(context, data.value) as string

  const presentationItems = data.presentation?.items
  const hasMultipleLanguages = presentationItems && Object.keys(presentationItems).length > 1

  // Если есть несколько языков, возвращаем объект
  if (hasMultipleLanguages && presentationItems) {
    return {
      Представление: presentationItems,
      Значение: valueResult,
    }
  }

  // Иначе возвращаем строку в формате "значение"(представление)
  const presentation = presentationItems?.[context.defaultLanguage] || presentationItems?.ru || ""

  // Если значение уже в кавычках, используем его как есть, иначе добавляем кавычки
  const valueString = valueResult.startsWith('"') && valueResult.endsWith('"') ? valueResult : `"${valueResult}"`

  return `${valueString}(${presentation})`
}

export const exportMedatataRefToEnterprise = (value: string): string => {
  const result = exportMetadataPathValueToEnterprise({} as VMContext, value)
  if (!result) throw new Error(`Invalid type for ref: ${value}`)
  return result
}
