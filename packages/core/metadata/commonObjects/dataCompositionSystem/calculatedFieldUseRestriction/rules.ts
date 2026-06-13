import type { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const CalculatedFieldUseRestrictionRules = {
  itemType: "CalculatedFieldUseRestriction",
  properties: {
    field: {
      type: "boolean",
      xml: "dcssch:field",
      yaml: "Поле",
      order: 1,
      implicitValueYAML: false,
    },
    condition: {
      type: "boolean",
      xml: "dcssch:condition",
      yaml: "Условие",
      order: 2,
      implicitValueYAML: false,
    },
    group: {
      type: "boolean",
      xml: "dcssch:group",
      yaml: "Группировка",
      order: 3,
      implicitValueYAML: false,
    },
    order: {
      type: "boolean",
      xml: "dcssch:order",
      yaml: "Порядок",
      order: 4,
      implicitValueYAML: false,
    },
  },
} as const satisfies MetadataItemRule
