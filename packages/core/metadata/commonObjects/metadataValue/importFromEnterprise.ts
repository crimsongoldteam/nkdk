import { format, parse } from "date-fns"
import { Context } from "../../context/types"
import { parseBoolean } from "../boolean/importFromEnterprise"
import { AppliedTypeFromEnterprise } from "../typeDescription/types"
import {
  MetadataFormChoiceListDesTimeValueEnterprise,
  MetadataValue,
  MetadataValueEnterprise,
  MetadataValueEnterpriseResult,
} from "./types"

const convertEnterpriseToRef = (value: string): string => {
  // Обработка Перечисление: Перечисление.ВидыДоговоров.СПоставщиком -> Enum.ВидыДоговоров.EnumValue.СПоставщиком
  if (value.startsWith("Перечисление.")) {
    const parts = value.substring("Перечисление.".length).split(".")
    if (parts.length >= 2) {
      const enumName = parts[0]
      const enumValue = parts.slice(1).join(".")
      return `Enum.${enumName}.EnumValue.${enumValue}`
    }
  }

  // Обработка Справочник: Справочник.Пользователи.ПустаяСсылка -> Catalog.Пользователи.EmptyRef
  if (value.startsWith("Справочник.")) {
    const parts = value.substring("Справочник.".length).split(".")
    if (parts.length === 2 && parts[1] === "ПустаяСсылка") {
      const catalogName = parts[0]
      return `Catalog.${catalogName}.EmptyRef`
    }
  }

  // Обработка других типов через AppliedTypeFromEnterprise
  const firstDotIndex = value.indexOf(".")
  if (firstDotIndex > 0) {
    const enterpriseTypeName = value.substring(0, firstDotIndex)
    const objectName = value.substring(firstDotIndex + 1)
    const appliedType = AppliedTypeFromEnterprise(enterpriseTypeName)
    if (appliedType) {
      return `${appliedType}.${objectName}`
    }
  }

  return value
}

const parseDateTime = (dateTime: string): string => {
  try {
    // Формат Enterprise: "dd.MM.yyyy HH:mm:ss"
    // Парсим дату и время, сохраняя локальное время без конвертации в UTC
    const date = parse(dateTime, "dd.MM.yyyy HH:mm:ss", new Date())
    if (isNaN(date.getTime())) {
      // Попробуем формат без времени
      const dateOnly = parse(dateTime, "dd.MM.yyyy", new Date())
      if (!isNaN(dateOnly.getTime())) {
        return format(dateOnly, "yyyy-MM-dd'T'00:00:00")
      }
      return dateTime
    }
    // Форматируем дату в ISO формат, сохраняя локальное время
    return format(date, "yyyy-MM-dd'T'HH:mm:ss")
  } catch {
    return dateTime
  }
}

const importStringValueFromEnterprise = (data: MetadataValueEnterprise): MetadataValue => {
  return {
    type: "string",
    value: data.Значение,
  }
}

const importDecimalValueFromEnterprise = (data: MetadataValueEnterprise): MetadataValue => {
  return {
    type: "decimal",
    value: Number(data.Значение),
  }
}

const importDateTimeValueFromEnterprise = (data: MetadataValueEnterprise): MetadataValue => {
  return {
    type: "dateTime",
    value: parseDateTime(data.Значение),
  }
}

const importBooleanValueFromEnterprise = (data: MetadataValueEnterprise): MetadataValue => {
  const booleanValue = parseBoolean(data.Значение as "Истина" | "Ложь", {} as Context)
  return {
    type: "boolean",
    value: booleanValue ?? false,
  }
}

const importRefValueFromEnterprise = (value: string): MetadataValue => {
  return {
    type: "ref",
    value: convertEnterpriseToRef(value),
  }
}

const importApplicationUsePurposeValueFromEnterprise = (data: MetadataValueEnterprise): MetadataValue => {
  return {
    type: "ApplicationUsePurpose",
    value: data.Значение,
  }
}

const importFixedArrayValueFromEnterprise = (_context: Context, data: string[]): MetadataValue => {
  return {
    type: "fixedArray",
    value: data.map((v) => {
      // Если это строка, которая является ссылкой (начинается с "Перечисление." или "Справочник.")
      if (typeof v === "string" && (v.startsWith("Перечисление.") || v.startsWith("Справочник."))) {
        return importRefValueFromEnterprise(v)
      }
      // Иначе это простое значение, создаем строковое значение
      return {
        type: "string",
        value: String(v),
      }
    }),
  }
}

const importFormChoiceListDesTimeValueFromEnterprise = (
  context: Context,
  data: MetadataFormChoiceListDesTimeValueEnterprise
): MetadataValue => {
  let value: MetadataValue

  // Определяем тип значения на основе поля Тип
  if (data.Тип === "Строка") {
    value = {
      type: "string",
      value: data.Значение,
    }
  } else if (data.Тип === "Число") {
    value = {
      type: "decimal",
      value: Number(data.Значение),
    }
  } else if (data.Тип === "Дата") {
    value = {
      type: "dateTime",
      value: parseDateTime(data.Значение),
    }
  } else if (data.Тип === "Булево " || data.Тип === "Булево") {
    const booleanValue = parseBoolean(data.Значение as "Истина" | "Ложь", context)
    value = {
      type: "boolean",
      value: booleanValue ?? false,
    }
  } else if (data.Тип === "ApplicationUsePurpose") {
    value = {
      type: "ApplicationUsePurpose",
      value: data.Значение,
    }
  } else {
    // По умолчанию строка
    value = {
      type: "string",
      value: data.Значение,
    }
  }

  return {
    type: "formChoiceListDesTimeValue",
    presentation: data.Представление
      ? {
          items: {
            [context.defaultLanguage || "ru"]: data.Представление,
          },
        }
      : undefined,
    value,
  }
}

export const importMetadataValueFromEnterprise = (
  context: Context,
  data: MetadataValueEnterpriseResult | undefined
): MetadataValue | undefined => {
  if (!data) return undefined

  // Если это строка, это ссылка (ref)
  if (typeof data === "string") {
    return importRefValueFromEnterprise(data)
  }

  // Если это массив строк, это fixedArray
  if (Array.isArray(data)) {
    return importFixedArrayValueFromEnterprise(context, data)
  }

  // Если это объект с полем Представление, это FormChoiceListDesTimeValue
  if (data && typeof data === "object" && "Представление" in data) {
    return importFormChoiceListDesTimeValueFromEnterprise(context, data as MetadataFormChoiceListDesTimeValueEnterprise)
  }

  // Если это обычный объект MetadataValueEnterprise
  if (data && typeof data === "object" && "Тип" in data && "Значение" in data) {
    const enterpriseData = data as MetadataValueEnterprise
    const тип = enterpriseData.Тип.trim()

    if (тип === "Строка") {
      return importStringValueFromEnterprise(enterpriseData)
    }
    if (тип === "Число") {
      return importDecimalValueFromEnterprise(enterpriseData)
    }
    if (тип === "Дата") {
      return importDateTimeValueFromEnterprise(enterpriseData)
    }
    if (тип === "Булево " || тип === "Булево") {
      return importBooleanValueFromEnterprise(enterpriseData)
    }
    if (тип === "ApplicationUsePurpose") {
      return importApplicationUsePurposeValueFromEnterprise(enterpriseData)
    }
  }

  return undefined
}
