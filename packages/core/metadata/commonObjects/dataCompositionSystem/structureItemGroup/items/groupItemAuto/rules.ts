import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { MetadataItemRule } from "~/metadata/orchestration"
export const GroupItemAutoRules = {
  itemType: "GroupItemAuto",
  properties: {
    use: booleanRule({
      xml: "dcsset:use",
      yaml: "Использование",
      implicitValueYAML: true,
    }),
  },
} as const satisfies MetadataItemRule
