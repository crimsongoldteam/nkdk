import { defineSettingsFragmentType } from "../settingsFragment/types"
import type { SettingsFragment, SettingsFragmentXML, SettingsFragmentYAML } from "../settingsFragment/types"

export type Chart = SettingsFragment
export type ChartXML = SettingsFragmentXML
export type ChartYAML = SettingsFragmentYAML

export const metadataRuleLayer000 = defineSettingsFragmentType<Chart>({
  propertyType: "Chart",
  canonicalAttributes: {
    "_xmlns:d4p1": "http://v8.1c.ru/8.2/data/chart",
    "_xsi:type": "d4p1:Chart",
  },
  matchXsiType: (xsiType) => xsiType === "d4p1:Chart" || xsiType.endsWith(":Chart"),
})
