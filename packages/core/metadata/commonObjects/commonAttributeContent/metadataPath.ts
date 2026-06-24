import { importMetadataObjectStringFromYAML } from "~/metadata/commonObjects/metadataPath/fromYAML"
import { exportMetadataObjectStringToYAML } from "~/metadata/commonObjects/metadataPath/toYAML"
import { ConfigurationContext } from "~/metadata/context/types"

const importPrefixOverrides: Record<string, string> = {
  "Справочники.": "Справочник.",
  "ПланыВидовРасчета.": "ПланВидовРасчета.",
}

const exportPrefixOverrides: Record<string, string> = {
  "Справочник.": "Справочники.",
  "ПланВидовРасчета.": "ПланыВидовРасчета.",
}

const replacePrefix = (value: string, replacements: Record<string, string>): string => {
  for (const [from, to] of Object.entries(replacements)) {
    if (value.startsWith(from)) return `${to}${value.slice(from.length)}`
  }

  return value
}

export const importCommonAttributeContentPathFromYAML = (context: ConfigurationContext, value: string): string => {
  const normalizedValue = replacePrefix(value, importPrefixOverrides)
  return importMetadataObjectStringFromYAML(context, undefined, normalizedValue) ?? normalizedValue
}

export const exportCommonAttributeContentPathToYAML = (context: ConfigurationContext, value: string): string => {
  const yamlValue = exportMetadataObjectStringToYAML(context, undefined, value) ?? value
  return replacePrefix(yamlValue, exportPrefixOverrides)
}
