import { Context } from "vm"
import { convertPath } from "./helper"
import {
  MetadataFieldsRulesToEnterprise,
  MetadataTypesRulesToEnterprise,
  MetadataValuesRulesToEnterprise,
} from "./types"

export const exportMetadataTypeToEnterprise = (_context: Context, name: string): string | undefined => {
  return convertPath(MetadataTypesRulesToEnterprise, name)
}

export const exportMetadataFieldToEnterprise = (_context: Context, name: string): string | undefined => {
  return convertPath(MetadataFieldsRulesToEnterprise, name)
}

export const exportMetadataValueToEnterprise = (_context: Context, name: string): string | undefined => {
  let processedPath = name
  if (name.startsWith("Enum.")) {
    const parts = name.split(".")
    const filteredParts = parts.filter((part) => part !== "EnumValue")
    processedPath = filteredParts.join(".")
  }

  return convertPath(MetadataValuesRulesToEnterprise, processedPath)
}
