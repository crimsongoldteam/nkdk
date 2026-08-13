import {
  controlled,
  definePropertyStateItemCapabilities,
} from "../configurationExtension/propertyStateCapabilities"
import { MetadataFilterCriterionRules } from "./rules"
export const metadataFilterCriterionPropertyStateCapabilities = definePropertyStateItemCapabilities(
  MetadataFilterCriterionRules,
  {
    profiles: ["borrowed-base", "mutable-synonym"],
    properties: controlled("type", "content"),
  },
)
