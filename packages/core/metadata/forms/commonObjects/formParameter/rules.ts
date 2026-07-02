import { typeDescriptionRule } from "~/metadata/commonObjects/typeDescription/types"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
export const FormParameterRules = {
  itemType: "FormParameter",
  properties: {
    name: stringRule({
      xml: "_name",
      required: true,
    }),
    type: typeDescriptionRule({
      yaml: "Тип",
      xml: "Type",
      defaultValueXMLRaw: {},
    }),
    keyParameter: booleanRule({
      yaml: "Ключевой",
      xml: "KeyParameter",
      implicitValueYAML: false,
    }),
  },
} as const satisfies MetadataItemRule
