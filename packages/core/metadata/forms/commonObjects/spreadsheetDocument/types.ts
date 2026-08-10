import { defineSettingsFragmentType } from "../settingsFragment/types"
import type { SettingsFragment, SettingsFragmentXML, SettingsFragmentYAML } from "../settingsFragment/types"

export type SpreadsheetDocument = SettingsFragment
export type SpreadsheetDocumentXML = SettingsFragmentXML
export type SpreadsheetDocumentYAML = SettingsFragmentYAML

export const metadataRuleLayer000 = defineSettingsFragmentType<SpreadsheetDocument>({
  propertyType: "SpreadsheetDocument",
  canonicalAttributes: {
    "_xmlns:mxl": "http://v8.1c.ru/8.2/data/spreadsheet",
    "_xsi:type": "mxl:SpreadsheetDocument",
  },
  matchXsiType: (xsiType) => xsiType === "mxl:SpreadsheetDocument" || xsiType.endsWith(":SpreadsheetDocument"),
})
