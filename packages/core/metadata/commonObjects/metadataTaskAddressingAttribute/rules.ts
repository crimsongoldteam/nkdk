import { MetadataTabularSectionAttributeRules } from "~/metadata/commonObjects/metadataAttribute/rules"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const MetadataTaskAddressingAttributeRules = {
  itemType: "MetadataAttribute",
  externalMetadata: { segment: "AddressingAttribute", placement: "ownerChild" },
  properties: {
    ...MetadataTabularSectionAttributeRules.properties,
    addressingDimension: {
      yaml: "ИзмерениеАдресации",
      xml: "AddressingDimension",
      type: "string",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    },
  },
} as const satisfies MetadataItemRule
