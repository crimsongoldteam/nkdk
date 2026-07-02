import { stringRule } from "../string/types"
import { MetadataTabularSectionAttributeRules } from "../metadataAttribute/rules"
import type { MetadataItemRule } from "../../orchestration/property/types"
export const MetadataTaskAddressingAttributeRules = {
  itemType: "MetadataAttribute",
  externalMetadata: { segment: "AddressingAttribute", placement: "ownerChild" },
  properties: {
    ...MetadataTabularSectionAttributeRules.properties,
    addressingDimension: stringRule({
      yaml: "ИзмерениеАдресации",
      xml: "AddressingDimension",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    }),
  },
} as const satisfies MetadataItemRule
