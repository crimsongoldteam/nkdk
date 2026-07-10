import { booleanRule } from "../../boolean/types"
import type { MetadataItemRule } from "../../../orchestration/property/types"
export const CalculatedFieldUseRestrictionRules = {
  itemType: "CalculatedFieldUseRestriction",
  properties: {
    field: booleanRule({
      xml: "dcssch:field",
      yaml: "Поле",
      order: 1,
      implicitValueYAML: false,
    }),
    condition: booleanRule({
      xml: "dcssch:condition",
      yaml: "Условие",
      order: 2,
      implicitValueYAML: false,
    }),
    group: booleanRule({
      xml: "dcssch:group",
      yaml: "Группировка",
      order: 3,
      implicitValueYAML: false,
    }),
    order: booleanRule({
      xml: "dcssch:order",
      yaml: "Порядок",
      order: 4,
      implicitValueYAML: false,
    }),
  },
} as const satisfies MetadataItemRule
