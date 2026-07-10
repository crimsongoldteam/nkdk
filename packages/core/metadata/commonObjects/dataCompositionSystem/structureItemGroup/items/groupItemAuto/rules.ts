import { booleanRule } from "../../../../boolean/types"
import { MetadataItemRule } from "../../../../../orchestration"
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
