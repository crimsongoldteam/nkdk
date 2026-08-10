import { booleanRule } from "../../boolean/types"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
export const CalculatedFieldUseRestrictionRules = {
  itemType: "CalculatedFieldUseRestriction",
  xmlOrder: [
    "field",
    "condition",
    "group",
    "order",
  ],
  properties: {
    field: booleanRule({
      xml: "dcssch:field",
      yaml: "Поле",
      implicitValueYAML: false,
    }),
    condition: booleanRule({
      xml: "dcssch:condition",
      yaml: "Условие",
      implicitValueYAML: false,
    }),
    group: booleanRule({
      xml: "dcssch:group",
      yaml: "Группировка",
      implicitValueYAML: false,
    }),
    order: booleanRule({
      xml: "dcssch:order",
      yaml: "Порядок",
      implicitValueYAML: false,
    }),
  },
} as const satisfies MetadataItemRule
