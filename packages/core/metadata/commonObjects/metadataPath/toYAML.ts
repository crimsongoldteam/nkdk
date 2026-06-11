import { Context } from "vm"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { convertPath } from "./helper"
import { MetadataFieldsRules, MetadataFieldsRulesToYAML, MetadataValuesRulesToYAML } from "./types"

const MetadataRootFieldsRulesToYAML: MetadataFieldsRules = {
  CommonCommand: { name: "ОбщаяКоманда" },
  ...MetadataFieldsRulesToYAML,
}

const MetadataRootValuesRulesToYAML: MetadataFieldsRules = {
  ...MetadataRootFieldsRulesToYAML,
  ...MetadataValuesRulesToYAML,
}

// export const exportMetadataTypeStringToYAML = (_context: Context, name: string): string | undefined => {
//   return convertPath(MetadataTypesRulesToYAML, name)
// }

export const exportMetadataFieldStringToYAML = (
  _context: Context,
  _rule: PropertyRule | undefined,
  name: string
): string | undefined => {
  return convertPath(MetadataRootFieldsRulesToYAML, name)
}

export const exportMetadataValueStringToYAML = (
  _context: Context,
  _rule: PropertyRule | undefined,
  name: string | undefined
): string | undefined => {
  if (!name) return undefined
  let processedPath = name
  if (name.startsWith("Enum.")) {
    const parts = name.split(".")
    const filteredParts = parts.filter((part) => part !== "EnumValue")
    processedPath = filteredParts.join(".")
  }

  return convertPath(MetadataRootValuesRulesToYAML, processedPath)
}
