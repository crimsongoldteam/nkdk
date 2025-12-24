import { Context } from "../../context/types"
import {
  MetadataValue,
  MetadataValueEnterprise,
  MetadataFormChoiceListValue,
} from "./types"

const valueToString = (value: MetadataValue["value"]): string => {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  if (typeof value === "boolean") return String(value)
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) {
    return value.map((v) => valueToString(v.value)).join(", ")
  }
  // Это должен быть MetadataFormChoiceListValue
  const formChoiceValue = value as MetadataFormChoiceListValue["value"]
  return valueToString(formChoiceValue.value)
}

export const exportMetadataValueToEnterprise = (
  _context: Context,
  data: MetadataValue | undefined
): MetadataValueEnterprise | undefined => {
  if (!data) return undefined

  return {
    Тип: data.type,
    Значение: valueToString(data.value),
  }
}
