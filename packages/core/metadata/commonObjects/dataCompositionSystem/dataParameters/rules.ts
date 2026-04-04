import { MetadataItemRule } from "~/metadata/orchestration"

export const DataParametersRules = {
  itemType: "DataParameters",
  properties: {
    parameters: {
      type: "SettingsParameterValueCollection",
      xml: "dcsset:dataParameters",
      yaml: "ПараметрыДанных",
      defaultItemRule: {
        type: "SettingsParameterValue",
        valueType: "Field",
      },
    },
  },
} as const satisfies MetadataItemRule
