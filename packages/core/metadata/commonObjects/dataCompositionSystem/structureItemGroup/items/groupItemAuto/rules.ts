import { MetadataItemRule } from "~/metadata/orchestration"

export const GroupItemAutoRules = {
  itemType: "GroupItemAuto",
  properties: {
    use: {
      type: "boolean",
      xml: "dcsset:use",
      yaml: "Использование",
    },
  },
} as const satisfies MetadataItemRule
