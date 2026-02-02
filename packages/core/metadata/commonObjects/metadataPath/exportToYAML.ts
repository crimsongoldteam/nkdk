import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { Context } from "vm"
import { convertPath } from "./helper"
import { MetadataFieldsRulesToEnterprise, MetadataValuesRulesToEnterprise } from "./types"

export const exportMetadataFieldStringToYAML = (_context: Context, _rule: PropertyRule, name: string): string | undefined => {
  return convertPath(MetadataFieldsRulesToEnterprise, name)
}

export const exportMetadataValueStringToYAML = (
  _context: Context,
  _rule: PropertyRule,
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
