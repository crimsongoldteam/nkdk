import { format } from "date-fns"
import { Context } from "../../context/types"
import { exportBooleanToEnterprise } from "../boolean/exportToEnterprise.ts"
import { AppliedType, AppliedTypeToEnterprise } from "../typeDescription/types"
import { MetadataFixedArrayValue, MetadataFormChoiceListValue, MetadataSimpleValue, MetadataValue } from "./types"
import {
  MetadataBooleanValue,
  MetadataDateTimeValue,
  MetadataDecimalValue,
  MetadataFixedArrayValueEnterprise,
  MetadataObjectRefValue,
  MetadataRefValue,
  MetadataValueEnterprise,
} from "./types.ts"

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
  const parts = value.split(".")

  const appliedType = parts[0] as AppliedType

  const partsResult = []

  const appliedTypeEnterprise = AppliedTypeToEnterprise[appliedType]
  if (!appliedTypeEnterprise) throw new Error(`Invalid type for ref: ${value}`)
  partsResult.push(appliedTypeEnterprise)

  const objectName = parts[1]
  if (!objectName) throw new Error(`Invalid object name for ref: ${value}`)

  partsResult.push(objectName)
  if (appliedType === "Enum" && parts.length >= 4) {
    partsResult.push(parts[3])
  }

  if (appliedType === "Catalog" && parts.length >= 3) {
    partsResult.push("ПустаяСсылка")
  }

  return partsResult.join(".")
}
