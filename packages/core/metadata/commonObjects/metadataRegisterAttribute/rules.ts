import { commonRegisterFieldProperties } from "~/metadata/commonObjects/metadataRegisterField/rules"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const MetadataRegisterAttributeRules = {
  itemType: "MetadataRegisterAttribute",
  properties: commonRegisterFieldProperties,
} as const satisfies MetadataItemRule
