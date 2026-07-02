import { registerSettingsFragmentType } from "../settingsFragment/types"
import type { SettingsFragment, SettingsFragmentXML, SettingsFragmentYAML } from "../settingsFragment/types"

export type GanttChart = SettingsFragment
export type GanttChartXML = SettingsFragmentXML
export type GanttChartYAML = SettingsFragmentYAML

registerSettingsFragmentType<GanttChart>({
  propertyType: "GanttChart",
  canonicalAttributes: {
    "_xmlns:d4p1": "http://v8.1c.ru/8.2/data/chart",
    "_xsi:type": "d4p1:GanttChart",
  },
  matchXsiType: (xsiType) => xsiType === "d4p1:GanttChart" || xsiType.endsWith(":GanttChart"),
})
