import { typeDescriptionRule } from "../../../commonObjects/typeDescription/types"
import { booleanRule } from "../../../commonObjects/boolean/types"
import { stringRule } from "../../../commonObjects/string/types"
import type { MetadataItemRule } from "../../../orchestration/property/types"
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
