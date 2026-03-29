import type { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const CalculatedFieldUseRestrictionRules = {
  itemType: "CalculatedFieldUseRestriction",
  properties: {
    field: {
      type: "boolean",
      xml: "dcssch:field",
      yaml: "Поле",
      order: 1,
      defaultValueYAML: false,
    },
    condition: {
      type: "boolean",
      xml: "dcssch:condition",
      yaml: "Условие",
      order: 2,
      defaultValueYAML: false,
    },
    group: {
      type: "boolean",
      xml: "dcssch:group",
      yaml: "Группировка",
      order: 3,
      defaultValueYAML: false,
    },
    order: {
      type: "boolean",
      xml: "dcssch:order",
      yaml: "Порядок",
      order: 4,
      defaultValueYAML: false,
    },
  },
} as const satisfies MetadataItemRule
