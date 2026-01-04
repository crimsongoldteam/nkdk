import { Context } from "vm"
import { convertPath } from "./helper"
import { MetadataFieldsRulesToEnterprise, MetadataValuesRulesToEnterprise } from "./types"

// export const exportMetadataTypeStringToEnterprise = (_context: Context, name: string): string | undefined => {
//   return convertPath(MetadataTypesRulesToEnterprise, name)
// }

export const exportMetadataFieldStringToEnterprise = (_context: Context, name: string): string | undefined => {
  return convertPath(MetadataFieldsRulesToEnterprise, name)
}

export const exportMetadataValueStringToEnterprise = (
  _context: Context,
  name: string | undefined
): string | undefined => {
  if (!name) return undefined
  let processedPath = name
  if (name.startsWith("Enum.")) {
    const parts = name.split(".")
    const filteredParts = parts.filter((part) => part !== "EnumValue")
    processedPath = filteredParts.join(".")
  }

  return convertPath(MetadataValuesRulesToEnterprise, processedPath)
}
