import { format } from "date-fns"
import { Context } from "../../context/types"
import { AppliedTypeToEnterprise } from "../typeDescription/types"
import {
  MetadataApplicationUsePurposeValue,
  MetadataBooleanValue,
  MetadataDateTimeValue,
  MetadataFixedArrayValue,
  MetadataFormChoiceListValue,
  MetadataNumberValue,
  MetadataRefValue,
  MetadataRefValueNew,
  MetadataStringValue,
  MetadataValue,
  MetadataValueEnterprise,
  MetadataValueEnterpriseResult,
} from "./types"

const convertRefToEnterprise = (value: string): string => {
  // Обработка Enum: Enum.ВидыДоговоров.EnumValue.СПоставщиком -> Перечисление.ВидыДоговоров.СПоставщиком
  if (value.startsWith("Enum.")) {
    const parts = value.split(".")
    if (parts.length >= 4 && parts[2] === "EnumValue") {
      const enumName = parts[1]
      const enumValue = parts.slice(3).join(".")
      return `Перечисление.${enumName}.${enumValue}`
    }
  }

  // Обработка Catalog: Catalog.Пользователи.EmptyRef -> Справочник.Пользователи.ПустаяСсылка
  if (value.startsWith("Catalog.")) {
    const parts = value.split(".")
    if (parts.length === 3 && parts[2] === "EmptyRef") {
      const catalogName = parts[1]
      return `Справочник.${catalogName}.ПустаяСсылка`
    }
  }

  // Обработка других типов через AppliedTypeToEnterprise
  for (const [prefix, enterpriseName] of Object.entries(AppliedTypeToEnterprise)) {
    if (value.startsWith(`${prefix}.`)) {
      const objectName = value.substring(prefix.length + 1)
      return `${enterpriseName}.${objectName}`
    }
  }

  return value
}

const formatDateTime = (dateTime: string): string => {
  const date = new Date(dateTime)
  return format(date, "dd.MM.yyyy HH:mm:ss")
}

const exportStringValueToEnterprise = (data: MetadataStringValue): MetadataValueEnterprise => {
  return {
    Тип: "Строка",
    Значение: data.value,
  }
}

const exportDecimalValueToEnterprise = (data: MetadataNumberValue): MetadataValueEnterprise => {
  return {
    Тип: "Число",
    Значение: String(data.value),
  }
}

const exportDateTimeValueToEnterprise = (data: MetadataDateTimeValue): MetadataValueEnterprise => {
  return {
    Тип: "Дата",
    Значение: formatDateTime(data.value),
  }
}

const exportBooleanValueToEnterprise = (data: MetadataBooleanValue): MetadataValueEnterprise => {
  return {
    Тип: "Булево ",
    Значение: data.value ? "Истина" : "Ложь",
  }
}

const exportRefValueToEnterprise = (data: MetadataRefValue | MetadataRefValueNew): string => {
  return convertRefToEnterprise(data.value)
}

const exportApplicationUsePurposeValueToEnterprise = (
  data: MetadataApplicationUsePurposeValue
): MetadataValueEnterprise => {
  return {
    Тип: "ApplicationUsePurpose",
    Значение: data.value,
  }
}

const exportFixedArrayValueToEnterprise = (context: Context, data: MetadataFixedArrayValue): string[] => {
  return data.value.map((v) => {
    const result = exportMetadataValueToEnterprise(context, v)
    if (typeof result === "string") {
      return result
    }
    if (result && typeof result === "object" && "Значение" in result) {
      return result.Значение
    }
    return String(result)
  })
}

const exportFormChoiceListDesTimeValueToEnterprise = (
  context: Context,
  data: MetadataFormChoiceListValue
): MetadataValueEnterpriseResult => {
  const valueResult = exportMetadataValueToEnterprise(context, data.value)
  let тип: string
  let значение: string

  if (typeof valueResult === "string") {
    тип = "Строка"
    значение = valueResult
  } else if (valueResult && typeof valueResult === "object" && "Тип" in valueResult && "Значение" in valueResult) {
    тип = valueResult.Тип
    значение = valueResult.Значение
  } else {
    тип = "Строка"
    значение = String(valueResult)
  }

  const presentation = data.presentation?.items?.[context.defaultLanguage] || data.presentation?.items?.ru || ""

  return {
    Представление: presentation,
    Тип: тип,
    Значение: значение,
  }
}

export const exportMetadataValueToEnterprise = (
  context: Context,
  data: MetadataValue | undefined
): MetadataValueEnterpriseResult => {
  if (!data) return undefined

  switch (data.type) {
    case "string":
      return exportStringValueToEnterprise(data)
    case "decimal":
      return exportDecimalValueToEnterprise(data)
    case "dateTime":
      return exportDateTimeValueToEnterprise(data)
    case "boolean":
      return exportBooleanValueToEnterprise(data)
    case "ref":
    case "designTimeRef":
      return exportRefValueToEnterprise(data)
    case "ApplicationUsePurpose":
      return exportApplicationUsePurposeValueToEnterprise(data)
    case "fixedArray":
      return exportFixedArrayValueToEnterprise(context, data)
    case "formChoiceListDesTimeValue":
      return exportFormChoiceListDesTimeValueToEnterprise(context, data)
    default:
      return undefined
  }
}
