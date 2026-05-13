import { commonRegisterFieldProperties } from "~/metadata/commonObjects/metadataRegisterField/rules"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const MetadataRegisterResourceRules = {
  itemType: "MetadataRegisterResource",
  properties: commonRegisterFieldProperties,
} as const satisfies MetadataItemRule
