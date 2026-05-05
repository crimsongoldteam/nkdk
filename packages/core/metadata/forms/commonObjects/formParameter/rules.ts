import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const FormParameterRules = {
  itemType: "FormParameter",
  properties: {
    name: {
      type: "string",
      xml: "_name",
      required: true,
    },
    type: {
      yaml: "Тип",
      type: "TypeDescription",
      xml: "Type",
      useAsShortValueYAML: true,
    },
    keyParameter: {
      yaml: "Ключевой",
      type: "boolean",
      xml: "KeyParameter",
    },
  },
} as const satisfies MetadataItemRule
