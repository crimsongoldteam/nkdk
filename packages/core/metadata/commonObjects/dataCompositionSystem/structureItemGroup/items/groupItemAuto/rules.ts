import { MetadataItemRule } from "~/metadata/orchestration"

export const GroupItemAutoRules = {
  itemType: "GroupItemAuto",
  properties: {
    use: {
      type: "boolean",
      xml: "dcsset:use",
      yaml: "Использование",
      implicitValueYAML: true,
    },
  },
} as const satisfies MetadataItemRule
