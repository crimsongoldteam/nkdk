import {
  metadataAttributeModelProperties,
  metadataAttributeRuleBase,
} from "./fragments"

export const MetadataAttributeRules = {
  ...metadataAttributeRuleBase,
  xmlOrder: Object.keys(metadataAttributeModelProperties),
  properties: metadataAttributeModelProperties,
} as const
