import { format, parse } from "date-fns"
import { Context } from "../../context/types"
import { parseBoolean } from "../boolean/importFromEnterprise"
import { importI8nTextFromEnterprise } from "../i8nText/importFromEnterprise.ts"
import { AppliedTypeEnterprise, AppliedTypeFromEnterprise } from "../typeDescription/types.ts"
import { MetadataFormChoiceListDesTimeValueEnterprise, MetadataValue, MetadataValueEnterprise } from "./types"
import {
  MetadataFixedArrayValueEnterprise,
  MetadataRefValueEnterprise,
  MetadataSimpleValueEnterprise,
} from "./types.ts"

export const importMetadataValueFromEnterprise = (
  context: Context,
  data: MetadataValueEnterprise | undefined
): MetadataValue | undefined => {
  if (!data) return undefined

  if (data && typeof data === "object" && "Представление" in data)
    return importFormChoiceListDesTimeValueFromEnterprise(context, data as MetadataFormChoiceListDesTimeValueEnterprise)

  return importSimpleValueFromEnterprise(context, data as MetadataSimpleValueEnterprise)
}

const importSimpleValueFromEnterprise = (context: Context, data: MetadataValueEnterprise): MetadataValue => {
  if (typeof data === "string") return importRefValueFromEnterprise(data)

  if (Array.isArray(data)) return importFixedArrayValueFromEnterprise(context, data)
  if (data && typeof data === "object" && "Тип" in data && "Значение" in data && typeof data.Значение === "string") {
    const type = data.Тип.trim()
    if (type === "Строка") {
      return importStringValueFromEnterprise(data as MetadataSimpleValueEnterprise)
    }
    if (type === "Число") {
      return importDecimalValueFromEnterprise(data as MetadataSimpleValueEnterprise)
    }
    if (type === "Дата") {
      return importDateTimeValueFromEnterprise(data as MetadataSimpleValueEnterprise)
    }
    if (type === "Булево " || type === "Булево") {
      return importBooleanValueFromEnterprise(data as MetadataSimpleValueEnterprise)
    }
  }

  throw new Error(`Invalid simple value ${JSON.stringify(data)}`)
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

const importStringValueFromEnterprise = (data: MetadataSimpleValueEnterprise): MetadataValue => {
  return {
    type: "string",
    value: data.Значение as string,
  }
}

const importDecimalValueFromEnterprise = (data: MetadataSimpleValueEnterprise): MetadataValue => {
  return {
    type: "decimal",
    value: Number(data.Значение as string),
  }
}

const importDateTimeValueFromEnterprise = (data: MetadataSimpleValueEnterprise): MetadataValue => {
  return {
    type: "dateTime",
    value: parseDateTime(data.Значение),
  }
}

const importBooleanValueFromEnterprise = (data: MetadataSimpleValueEnterprise): MetadataValue => {
  const booleanValue = parseBoolean(data.Значение as "Истина" | "Ложь", {} as Context)
  return {
    type: "boolean",
    value: booleanValue ?? false,
  }
}

const importRefValueFromEnterprise = (value: MetadataRefValueEnterprise): MetadataValue => {
  return {
    type: "ref",
    value: importRefFromEnterprise(value),
  }
}

// const importApplicationUsePurposeValueFromEnterprise = (data: MetadataValueEnterprise): MetadataValue => {
//   return {
//     type: "ApplicationUsePurpose",
//     value: data.Значение,
//   }
// }

const importFixedArrayValueFromEnterprise = (
  context: Context,
  data: MetadataFixedArrayValueEnterprise
): MetadataValue => {
  return {
    type: "fixedArray",
    value: data.map((v) => importMetadataValueFromEnterprise(context, v)!) as MetadataValue[],
  }
}

const importFormChoiceListDesTimeValueFromEnterprise = (
  context: Context,
  data: MetadataFormChoiceListDesTimeValueEnterprise
): MetadataValue => {
  let value = importSimpleValueFromEnterprise(context, data)!
  return {
    type: "formChoiceListDesTimeValue",
    presentation: importI8nTextFromEnterprise(context, data.Представление),
    value: value,
  }
}

const importRefFromEnterprise = (value: string): string => {
  const parts = value.split(".")

  const appliedTypeEnterprise = parts[0] as AppliedTypeEnterprise

  const partsResult = []

  const appliedType = AppliedTypeFromEnterprise(appliedTypeEnterprise)
  if (!appliedType) throw new Error(`Invalid type for ref: ${value}`)
  partsResult.push(appliedType)

  const objectName = parts[1]
  if (!objectName) throw new Error(`Invalid object name for ref: ${value}`)

  partsResult.push(objectName)
  if (appliedType === "Enum" && parts.length >= 2) {
    partsResult.push("EnumValue")
    partsResult.push(parts[2])
  }

  if (appliedType === "Catalog" && parts.length >= 2) {
    partsResult.push("EmptyRef")
  }

  return partsResult.join(".")
}
