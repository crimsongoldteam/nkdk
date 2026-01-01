import { Context } from "vm"
import { convertPath } from "./helper"
import {
  MetadataFieldsRulesFromEnterprise,
  MetadataTypesRulesFromEnterprise,
  MetadataValuesRulesFromEnterprise,
} from "./types"

export const importMetadataTypeFromEnterprise = (_context: Context, name: string): string | undefined => {
  return convertPath(MetadataTypesRulesFromEnterprise, name)
}

export const importMetadataFieldFromEnterprise = (_context: Context, name: string): string | undefined => {
  return convertPath(MetadataFieldsRulesFromEnterprise, name)
}

export const importMetadataValueFromEnterprise = (_context: Context, name: string): string | undefined => {
  const convertedPath = convertPath(MetadataValuesRulesFromEnterprise, name)

  // Добавляем EnumValue для перечислений (Enum.*)
  if (convertedPath && convertedPath.startsWith("Enum.")) {
    const parts = convertedPath.split(".")
    // Если уже есть EnumValue, не добавляем
    if (!parts.includes("EnumValue") && parts.length >= 3) {
      // Вставляем EnumValue перед последним сегментом
      const lastPart = parts.pop()
      parts.push("EnumValue", lastPart!)
      return parts.join(".")
    }
  }

  return convertedPath
}
