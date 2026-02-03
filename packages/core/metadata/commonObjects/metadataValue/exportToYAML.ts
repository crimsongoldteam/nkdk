import { format } from "date-fns"
import { Context as VMContext } from "vm"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { exportBooleanToYAML } from "../boolean/exportToYAML"
import { exportMetadataValueStringToYAML } from "../metadataPath/exportToYAML"
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

export const exportMetadataValueToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataValue | undefined
): MetadataValueEnterprise | undefined => {
  if (!data) return undefined

  if (data.type === "fixedArray") return exportFixedArrayValueToYAML(context, _rule, data)
  if (data.type === "formChoiceListDesTimeValue") return exportFormChoiceListValueToYAML(context, _rule, data)
  if (data.type === "string") return exportStringValueToYAML(data)
  if (data.type === "decimal") return exportDecimalValueToYAML(data)
  if (data.type === "dateTime") return exportDateTimeValueToYAML(data)
  if (data.type === "boolean") return exportBooleanValueToYAML(context, _rule, data)
  if (data.type === "ref") return exportRefValueToYAML(data)
  if (data.type === "objectRef") return exportObjectRefValueToYAML(data)
  // if (data.type === "ApplicationUsePurpose") return exportApplicationUsePurposeValueToYAML(data)
  throw new Error(`Invalid type ${JSON.stringify(data)}`)
}

const formatDateTime = (dateTime: string): string => {
  const date = new Date(dateTime)
  return format(date, "dd.MM.yyyy HH:mm:ss")
}

const exportStringValueToYAML = (data: MetadataSimpleValue): MetadataValueEnterprise => {
  return `"${data.value as string}"`
}

const exportDecimalValueToYAML = (data: MetadataDecimalValue): MetadataValueEnterprise => {
  return data.value
}

const exportDateTimeValueToYAML = (data: MetadataDateTimeValue): MetadataValueEnterprise => {
  return formatDateTime(data.value)
}

const exportBooleanValueToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataBooleanValue
): MetadataValueEnterprise => {
  return exportBooleanToYAML(context, _rule, data.value)!
}

const exportRefValueToYAML = (data: MetadataRefValue): MetadataValueEnterprise => {
  return exportMedatataRefToYAML(data.value)
}

const exportObjectRefValueToYAML = (data: MetadataObjectRefValue): MetadataValueEnterprise => {
  return exportMedatataRefToYAML(data.value)
}

const exportFixedArrayValueToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFixedArrayValue
): MetadataValueEnterprise => {
  return data.value.map((v) => exportMetadataValueToYAML(context, _rule, v)!) as MetadataFixedArrayValueEnterprise
}

export const exportFormChoiceListValueToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFormChoiceListValue
): MetadataFormChoiceListValueEnterprise => {
  const valueResult = exportMetadataValueToYAML(context, _rule, data.value)

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

export const exportMedatataRefToYAML = (value: string): string => {
  const result = exportMetadataPathValueToYAML({} as VMContext, {} as PropertyRule, value)
  if (!result) throw new Error(`Invalid type for ref: ${value}`)
  return result
}

const exportMetadataPathValueToYAML = (context: VMContext, rule: PropertyRule, value: string): string | undefined => {
  return exportMetadataValueStringToYAML(context, rule, value)
}
