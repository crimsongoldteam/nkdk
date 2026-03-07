import { format } from "date-fns"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { exportBooleanToYAML } from "../boolean/toYAML"
import { exportMetadataValueStringToYAML as exportMetadataPathValueToYAML } from "../metadataPath/toYAML"
import {
  MetadataBooleanValue,
  MetadataDateTimeValue,
  MetadataDecimalValue,
  MetadataFixedArrayValue,
  MetadataFixedArrayValueYAML,
  MetadataFormChoiceListValue,
  MetadataFormChoiceListValueYAML,
  MetadataObjectRefValue,
  MetadataRefValue,
  MetadataSimpleValue,
  MetadataValue,
  MetadataValueYAML,
} from "./types"

export const exportMetadataValueToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataValue | undefined
): MetadataValueYAML | undefined => {
  if (!data) return undefined

  if (data.type === "fixedArray") return exportFixedArrayValueToYAML(context, undefined, data)
  if (data.type === "formChoiceListDesTimeValue") return exportFormChoiceListValueToYAML(context, undefined, data)
  if (data.type === "string") return exportStringValueToYAML(data)
  if (data.type === "decimal") return exportDecimalValueToYAML(data)
  if (data.type === "dateTime") return exportDateTimeValueToYAML(data)
  if (data.type === "boolean") return exportBooleanValueToYAML(context, undefined, data)
  if (data.type === "ref") return exportRefValueToYAML(context, data)
  if (data.type === "objectRef") return exportObjectRefValueToYAML(context, data)
  // if (data.type === "ApplicationUsePurpose") return exportApplicationUsePurposeValueToYAML(data)
  throw new Error(`Invalid type ${JSON.stringify(data)}`)
}

const formatDateTime = (dateTime: string): string => {
  const date = new Date(dateTime)
  return format(date, "dd.MM.yyyy HH:mm:ss")
}

const exportStringValueToYAML = (data: MetadataSimpleValue): MetadataValueYAML => {
  return `"${data.value as string}"`
}

const exportDecimalValueToYAML = (data: MetadataDecimalValue): MetadataValueYAML => {
  return data.value
}

const exportDateTimeValueToYAML = (data: MetadataDateTimeValue): MetadataValueYAML => {
  return formatDateTime(data.value)
}

const exportBooleanValueToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataBooleanValue
): MetadataValueYAML => {
  return exportBooleanToYAML(context, undefined, data.value)!
}

const exportRefValueToYAML = (context: ConfigurationContext, data: MetadataRefValue): MetadataValueYAML => {
  return exportMedatataRefToYAML(context, data.value)
}

const exportObjectRefValueToYAML = (context: ConfigurationContext, data: MetadataObjectRefValue): MetadataValueYAML => {
  return exportMedatataRefToYAML(context, data.value)
}

const exportFixedArrayValueToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFixedArrayValue
): MetadataValueYAML => {
  return data.value.map((v) => exportMetadataValueToYAML(context, undefined, v)!) as MetadataFixedArrayValueYAML
}

export const exportFormChoiceListValueToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFormChoiceListValue
): MetadataFormChoiceListValueYAML => {
  const valueResult = exportMetadataValueToYAML(context, undefined, data.value)

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

export const exportMedatataRefToYAML = (context: ConfigurationContext, value: string): string => {
  const result = exportMetadataPathValueToYAML(context, undefined, value)
  if (!result) throw new Error(`Invalid type for ref: ${value}`)
  return result
}

registerTypeRule("MetadataValue", "exportToYAML", exportMetadataValueToYAML)
