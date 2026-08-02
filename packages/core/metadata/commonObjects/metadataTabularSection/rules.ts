import {
  metadataTabularSectionModelProperties,
  metadataTabularSectionRuleBase,
} from "./fragments"

export const MetadataTabularSectionRules = {
  ...metadataTabularSectionRuleBase,
  xmlOrder: Object.keys(metadataTabularSectionModelProperties),
  properties: metadataTabularSectionModelProperties,
} as const
