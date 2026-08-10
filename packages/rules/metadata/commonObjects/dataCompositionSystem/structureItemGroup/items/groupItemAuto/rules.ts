import { booleanRule } from "../../../../boolean/types"
import { MetadataItemRule } from "../../../../../ruleRuntime"
export const GroupItemAutoRules = {
  itemType: "GroupItemAuto",
  xsiType: "dcsset:GroupItemAuto",
  xmlOrder: [
    "use",
  ],
  properties: {
    use: booleanRule({
      xml: "dcsset:use",
      yaml: "Использование",
      implicitValueYAML: true,
    }),
  },
} as const satisfies MetadataItemRule
