import { format, parse } from "date-fns"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { formulaFormatParser } from "~/metadata/helpers/formulaFormatParser/formulaFormatParser"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { importI8nTextFromYAML } from "../i8nText/fromYAML"
import { importMetadataValueStringFromYAML } from "../metadataPath/fromYAML"
import {
  MetadataFixedArrayValueYAML,
  MetadataFormChoiceListValue,
  MetadataFormChoiceListValueYAML,
  MetadataValueYAML,
} from "./types"

export const importMetadataValueFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataValueYAML | undefined
): any => {
  if (data === undefined) return undefined
  const ruleAny = _rule as any
  const withType = Boolean(ruleAny?.withType)

  if (typeof data === "object" && data !== null && !Array.isArray(data) && "Представление" in data) {
    return importFormChoiceListValueFromYAML(context, undefined, data as MetadataFormChoiceListValueYAML)
  }

  if (Array.isArray(data)) {
    return importFixedArrayValueFromYAML(context, undefined, data)
  }

  if (typeof data === "number") {
    if (ruleAny?.valueType === "string") {
      return withType ? { type: "string", value: String(data) } : data
    }
    return { type: "decimal", value: data }
  }

  if (typeof data === "string") {
    if (ruleAny?.valueType === "string") {
      const unquoted = data.startsWith('"') && data.endsWith('"') ? data.slice(1, -1) : data
      return withType ? { type: "string", value: unquoted } : unquoted
    }
    if (ruleAny?.valueType === "dateTime" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data)) {
      return withType ? { type: "dateTime", value: data } : data
    }
    // В режиме "без типа" для обычной строки не пытаемся угадывать тип — возвращаем примитив
    // Важно: только для верхнего уровня (когда правило передано явно).
    // Внутри composite-типов (fixedArray, formChoiceList...) правило часто undefined,
    // и там нам нужны эвристики (ref/dateTime/boolean/decimal/...).
    if (_rule && !withType && ruleAny?.valueType === undefined) {
      return data
    }
    return importStringValueFromYAML(context, undefined, data)
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
): any => {
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

  // fallback: если не конвертится в ref — считаем строкой
  try {
    return importMetadataRefFromYAML(context, undefined, data)
  } catch {
    return { type: "string", value: data }
  }
}

const importFixedArrayValueFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFixedArrayValueYAML
): any => {
  return {
    type: "fixedArray",
    value: data.map((v) => importMetadataValueFromYAML(context, undefined, v)!) as any[],
  }
}

export const importFormChoiceListValueFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFormChoiceListValueYAML
): MetadataFormChoiceListValue => {
  if (typeof data === "string") {
    const parsed = formulaFormatParser(data)
    // Если formula пустая, значит это формат (presentation) без значения
    const value = parsed.formula ? importMetadataValueFromYAML(context, undefined, parsed.formula) : undefined
    const presentation = importI8nTextFromYAML({ context, rule: { type: "I8nText" }, value: parsed.parameters[0] })

    return {
      type: "formChoiceListDesTimeValue",
      presentation: presentation,
      value: value,
    }
  }
  const value = importMetadataValueFromYAML(context, undefined, data.Значение)!
  return {
    type: "formChoiceListDesTimeValue",
    presentation: importI8nTextFromYAML({ context, rule: { type: "I8nText" }, value: data.Представление }),
    value: value,
  }
}

export const importMetadataRefFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string
): any => {
  const convertedValue = importMetadataValueStringFromYAML(context, undefined, value)
  if (!convertedValue) throw new Error(`Invalid type for ref: ${value}`)
  // эвристика: ref почти всегда содержит точки (Enum., Catalog., ChartOf..., ...)
  if (!convertedValue.includes(".")) throw new Error(`Invalid type for ref: ${value}`)

  return {
    type: "ref",
    value: convertedValue,
  }
}

registerTypeRule("MetadataValue", "importFromYAML", importMetadataValueFromYAML)
