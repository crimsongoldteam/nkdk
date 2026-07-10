import { registerSettingsFragmentType } from "../settingsFragment/types"
import type { SettingsFragment, SettingsFragmentXML, SettingsFragmentYAML } from "../settingsFragment/types"

export type Planner = SettingsFragment
export type PlannerXML = SettingsFragmentXML
export type PlannerYAML = SettingsFragmentYAML

registerSettingsFragmentType<Planner>({
  propertyType: "Planner",
  canonicalAttributes: {
    "_xmlns:pl": "http://v8.1c.ru/8.3/data/planner",
    "_xsi:type": "pl:Planner",
  },
  matchXsiType: (xsiType) => xsiType === "pl:Planner" || xsiType.endsWith(":Planner"),
})
