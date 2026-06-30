import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
export const FormParameterRules = {
  itemType: "FormParameter",
  properties: {
    name: stringRule({
      xml: "_name",
      required: true,
    }),
    type: {
      yaml: "Тип",
      type: "TypeDescription",
      xml: "Type",
      defaultValueXMLRaw: {},
    },
    keyParameter: booleanRule({
      yaml: "Ключевой",
      xml: "KeyParameter",
      implicitValueYAML: false,
    }),
  },
} as const satisfies MetadataItemRule
