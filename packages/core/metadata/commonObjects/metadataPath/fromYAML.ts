import { Context } from "vm"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { convertPath } from "./helper"
import { MetadataFieldsRules, MetadataFieldsRulesFromYAML, MetadataValuesRulesFromYAML } from "./types"

const MetadataRootFieldsRulesFromYAML: MetadataFieldsRules = {
  ОбщаяКоманда: { name: "CommonCommand" },
  ...MetadataFieldsRulesFromYAML,
}

const MetadataRootValuesRulesFromYAML: MetadataFieldsRules = {
  ...MetadataRootFieldsRulesFromYAML,
  ...MetadataValuesRulesFromYAML,
}

// export const importMetadataTypeStringFromYAML = (_context: Context, name: string): string | undefined => {
//   return convertPath(MetadataTypesRulesFromYAML, name)
// }

export const importMetadataFieldStringFromYAML = (
  _context: Context,
  _rule: PropertyRule | undefined,
  name: string
): string | undefined => {
  return convertPath(MetadataRootFieldsRulesFromYAML, name)
}

export const importMetadataValueStringFromYAML = (
  _context: Context,
  _rule: PropertyRule | undefined,
  name: string
): string | undefined => {
  const convertedPath = convertPath(MetadataRootValuesRulesFromYAML, name)

  if (convertedPath && convertedPath.startsWith("Enum.")) {
    const parts = convertedPath.split(".")
    if (!parts.includes("EnumValue") && parts.length >= 3) {
      const lastPart = parts[parts.length - 1]
      if (lastPart !== "EmptyRef") {
        parts.pop()
        parts.push("EnumValue", lastPart)
        return parts.join(".")
      }
    }
  }

  return convertedPath
}
