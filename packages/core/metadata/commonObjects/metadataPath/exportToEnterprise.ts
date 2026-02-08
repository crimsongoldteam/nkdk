import { Context } from "vm"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { convertPath } from "./helper"
import { MetadataFieldsRulesToEnterprise, MetadataValuesRulesToEnterprise } from "./types"

// export const exportMetadataTypeStringToEnterprise = (_context: Context, name: string): string | undefined => {
//   return convertPath(MetadataTypesRulesToEnterprise, name)
// }

export const exportMetadataFieldStringToEnterprise = (
  _context: Context,
  _rule: PropertyRule<any> | undefined,
  name: string
): string | undefined => {
  return convertPath(MetadataFieldsRulesToEnterprise, name)
}

export const exportMetadataValueStringToEnterprise = (
  _context: Context,
  _rule: PropertyRule<any> | undefined,
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
