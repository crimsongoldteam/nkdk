import { MetadataItemRule } from "~/metadata/orchestration"

export const CalculatedFieldUseRestrictionRules = {
  itemType: "CalculatedFieldUseRestriction",
  properties: {
    field: {
      type: "boolean",
      xml: "dcssch:field",
      yaml: "Поле",
      order: 1,
    },
    condition: {
      type: "boolean",
      xml: "dcssch:condition",
      yaml: "Условие",
      order: 2,
    },
    group: {
      type: "boolean",
      xml: "dcssch:group",
      yaml: "Группировка",
      order: 3,
    },
    order: {
      type: "boolean",
      xml: "dcssch:order",
      yaml: "Порядок",
      order: 4,
    },
  },
} as const satisfies MetadataItemRule
