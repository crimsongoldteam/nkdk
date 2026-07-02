import { registerSettingsFragmentType } from "../settingsFragment/types"
import type { SettingsFragment, SettingsFragmentXML, SettingsFragmentYAML } from "../settingsFragment/types"

export type FlowchartContext = SettingsFragment
export type FlowchartContextXML = SettingsFragmentXML
export type FlowchartContextYAML = SettingsFragmentYAML

registerSettingsFragmentType<FlowchartContext>({
  propertyType: "FlowchartContext",
  canonicalAttributes: {
    "_xmlns:d4p1": "http://v8.1c.ru/8.2/data/graphscheme",
    "_xsi:type": "d4p1:FlowchartContextType",
  },
  matchXsiType: (xsiType) => xsiType === "d4p1:FlowchartContextType" || xsiType.endsWith(":FlowchartContextType"),
})
