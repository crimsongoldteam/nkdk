import { Context } from "vm"
import { importMetadataFieldStringFromYAML } from "~/metadata/commonObjects/metadataPath/fromYAML"
import { exportMetadataFieldStringToYAML } from "~/metadata/commonObjects/metadataPath/toYAML"

const importPrefixOverrides: Record<string, string> = {
  "Справочники.": "Catalog.",
  "ПланыВидовРасчета.": "ChartOfCalculationTypes.",
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

export const importCommonAttributeContentPathFromYAML = (context: Context, value: string): string => {
  const normalizedValue = replacePrefix(value, importPrefixOverrides)
  return importMetadataFieldStringFromYAML(context, undefined, normalizedValue)!
}

export const exportCommonAttributeContentPathToYAML = (context: Context, value: string): string => {
  const yamlValue = exportMetadataFieldStringToYAML(context, undefined, value)!
  return replacePrefix(yamlValue, exportPrefixOverrides)
}
