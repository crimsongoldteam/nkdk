import { format } from "date-fns"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { exportBooleanToEnterprise } from "../boolean/exportToEnterprise"
import { exportMetadataValueStringToEnterprise as exportMetadataPathValueToEnterprise } from "../metadataPath/exportToEnterprise"
import {
  MetadataBooleanValue,
  MetadataDateTimeValue,
  MetadataDecimalValue,
  MetadataFixedArrayValue,
  MetadataFixedArrayValueEnterprise,
  MetadataFormChoiceListValue,
  MetadataFormChoiceListValueEnterprise,
  MetadataObjectRefValue,
  MetadataRefValue,
  MetadataSimpleValue,
  MetadataValue,
  MetadataValueEnterprise,
} from "./types"

export const exportMetadataValueToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataValue | undefined
): MetadataValueEnterprise | undefined => {
  if (!data) return undefined

  if (data.type === "fixedArray") return exportFixedArrayValueToEnterprise(context, undefined, data)
  if (data.type === "formChoiceListDesTimeValue") return exportFormChoiceListValueToEnterprise(context, undefined, data)
  if (data.type === "string") return exportStringValueToEnterprise(data)
  if (data.type === "decimal") return exportDecimalValueToEnterprise(data)
  if (data.type === "dateTime") return exportDateTimeValueToEnterprise(data)
  if (data.type === "boolean") return exportBooleanValueToEnterprise(context, undefined, data)
  if (data.type === "ref") return exportRefValueToEnterprise(context, data)
  if (data.type === "objectRef") return exportObjectRefValueToEnterprise(context, data)
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

const exportBooleanValueToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataBooleanValue
): MetadataValueEnterprise => {
  return exportBooleanToEnterprise(context, undefined, data.value)!
}

const exportRefValueToEnterprise = (context: ConfigurationContext, data: MetadataRefValue): MetadataValueEnterprise => {
  return exportMedatataRefToEnterprise(context, data.value)
}

const exportObjectRefValueToEnterprise = (
  context: ConfigurationContext,
  data: MetadataObjectRefValue
): MetadataValueEnterprise => {
  return exportMedatataRefToEnterprise(context, data.value)
}

const exportFixedArrayValueToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataFixedArrayValue
): MetadataValueEnterprise => {
  return data.value.map(
    (v) => exportMetadataValueToEnterprise(context, undefined, v)!
  ) as MetadataFixedArrayValueEnterprise
}

export const exportFormChoiceListValueToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataFormChoiceListValue
): MetadataFormChoiceListValueEnterprise => {
  const valueResult = exportMetadataValueToEnterprise(context, undefined, data.value)

  const presentationItems = data.presentation?.items
  const hasMultipleLanguages = presentationItems && Object.keys(presentationItems).length > 1

  // Если значение undefined, всегда возвращаем строку в формате (представление)
  if (valueResult === undefined) {
    const presentation = presentationItems?.[context.defaultLanguage] || presentationItems?.ru || ""
    return `(${presentation})`
  }

  // Если есть несколько языков, возвращаем объект
  if (hasMultipleLanguages && presentationItems) {
    return {
      Представление: presentationItems,
      Значение: valueResult,
    }
  }

  // Иначе возвращаем строку в формате "значение"(представление)
  const presentation = presentationItems?.[context.defaultLanguage] || presentationItems?.ru || ""
  return `${valueResult}(${presentation})`
}

export const exportMedatataRefToEnterprise = (context: ConfigurationContext, value: string): string => {
  const result = exportMetadataPathValueToEnterprise(context, undefined, value)
  if (!result) throw new Error(`Invalid type for ref: ${value}`)
  return result
}

registerTypeRule("MetadataValue", "exportToEnterprise", exportMetadataValueToEnterprise)
