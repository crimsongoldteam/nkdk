import { format, parse } from "date-fns"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { formulaFormatParser } from "~/metadata/helpers/formulaFormatParser/formulaFormatParser"
import { ConfigurationContext } from "../../context/types"
import { importI8nTextFromYAML } from "../i8nText/importFromYAML"
import { importMetadataValueStringFromYAML } from "../metadataPath/importFromYAML"
import {
  MetadataFixedArrayValueEnterprise,
  MetadataFormChoiceListValue,
  MetadataFormChoiceListValueEnterprise,
  MetadataValue,
  MetadataValueEnterprise,
} from "./types"

export const importMetadataValueFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataValueEnterprise | undefined
): MetadataValue | undefined => {
  if (data === undefined) return undefined

  if (typeof data === "object" && data !== null && !Array.isArray(data) && "Представление" in data) {
    return importFormChoiceListValueFromYAML(context, _rule, data as MetadataFormChoiceListValueEnterprise)
  }

  if (Array.isArray(data)) {
    return importFixedArrayValueFromYAML(context, _rule, data)
  }

  if (typeof data === "number") {
    return {
      type: "decimal",
      value: data,
    }
  }

  if (typeof data === "string") {
    return importStringValueFromYAML(context, _rule, data)
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

const importStringValueFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: string
): MetadataValue => {
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

  // Проверяем на FormChoiceListDesTimeValue с пустым значением: формат (представление)
  const emptyFormChoiceListMatch = data.match(/^\(([^)]+)\)$/)
  if (emptyFormChoiceListMatch) {
    const [, presentation] = emptyFormChoiceListMatch
    return {
      type: "formChoiceListDesTimeValue",
      presentation: {
        items: {
          ru: presentation,
        },
      },
      value: undefined,
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

  return importMetadataRefFromYAML(context, _rule, data)
}

const importFixedArrayValueFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFixedArrayValueEnterprise
): MetadataValue => {
  return {
    type: "fixedArray",
    value: data.map((v) => importMetadataValueFromYAML(context, _rule, v)!) as MetadataValue[],
  }
}

export const importFormChoiceListValueFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFormChoiceListValueEnterprise
): MetadataFormChoiceListValue => {
  if (typeof data === "string") {
    const parsed = formulaFormatParser(data)
    // Если formula пустая, значит это формат (presentation) без значения
    const value = parsed.formula ? importMetadataValueFromYAML(context, _rule, parsed.formula) : undefined
    const presentation = importI8nTextFromYAML(context, _rule, parsed.parameters[0])

    return {
      type: "formChoiceListDesTimeValue",
      presentation: presentation,
      value: value,
    }
  }
  const value = importMetadataValueFromYAML(context, _rule, data.Значение)!
  return {
    type: "formChoiceListDesTimeValue",
    presentation: importI8nTextFromYAML(context, _rule, data.Представление),
    value: value,
  }
}

export const importMetadataRefFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string
): MetadataValue => {
  const convertedValue = importMetadataValueStringFromYAML(context, _rule, value)
  if (!convertedValue) throw new Error(`Invalid type for ref: ${value}`)

  return {
    type: "ref",
    value: convertedValue,
  }
}
