import { format, parse } from "date-fns"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { formulaFormatParser } from "~/metadata/helpers/formulaFormatParser/formulaFormatParser"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"
import { importI8nTextFromEnterprise } from "../i8nText/importFromEnterprise"
import { importMetadataValueStringFromEnterprise } from "../metadataPath/importFromEnterprise"
import {
  MetadataFixedArrayValueEnterprise,
  MetadataFormChoiceListValue,
  MetadataFormChoiceListValueEnterprise,
  MetadataValue,
  MetadataValueEnterprise,
} from "./types"

export const importMetadataValueFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataValueEnterprise | undefined
): MetadataValue | undefined => {
  if (data === undefined) return undefined

  if (typeof data === "object" && data !== null && !Array.isArray(data) && "Представление" in data) {
    return importFormChoiceListValueFromEnterprise(context, undefined, data as MetadataFormChoiceListValueEnterprise)
  }

  if (Array.isArray(data)) {
    return importFixedArrayValueFromEnterprise(context, undefined, data)
  }

  if (typeof data === "number") {
    return {
      type: "decimal",
      value: data,
    }
  }

  if (typeof data === "string") {
    return importStringValueFromEnterprise(context, undefined, data)
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

const importStringValueFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
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

  return importMetadataRefFromEnterprise(context, undefined, data)
}

const importFixedArrayValueFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataFixedArrayValueEnterprise
): MetadataValue => {
  return {
    type: "fixedArray",
    value: data.map((v) => importMetadataValueFromEnterprise(context, undefined, v)!) as MetadataValue[],
  }
}

export const importFormChoiceListValueFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataFormChoiceListValueEnterprise
): MetadataFormChoiceListValue => {
  if (typeof data === "string") {
    const parsed = formulaFormatParser(data)
    // Если formula пустая, значит это формат (presentation) без значения
    const value = parsed.formula ? importMetadataValueFromEnterprise(context, undefined, parsed.formula) : undefined
    const presentation = importI8nTextFromEnterprise(context, undefined, parsed.parameters[0])

    return {
      type: "formChoiceListDesTimeValue",
      presentation: presentation,
      value: value,
    }
  }
  const value = importMetadataValueFromEnterprise(context, undefined, data.Значение)!
  return {
    type: "formChoiceListDesTimeValue",
    presentation: importI8nTextFromEnterprise(context, undefined, data.Представление),
    value: value,
  }
}

export const importMetadataRefFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  value: string
): MetadataValue => {
  const convertedValue = importMetadataValueStringFromEnterprise(context, undefined, value)
  if (!convertedValue) throw new Error(`Invalid type for ref: ${value}`)

  return {
    type: "ref",
    value: convertedValue,
  }
}

registerTypeRule("MetadataValue", "importFromEnterprise", importMetadataValueFromEnterprise)
