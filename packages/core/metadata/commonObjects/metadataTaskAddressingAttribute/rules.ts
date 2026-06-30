import { stringRule } from "~/metadata/commonObjects/string/types"
import { MetadataTabularSectionAttributeRules } from "~/metadata/commonObjects/metadataAttribute/rules"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
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
