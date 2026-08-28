import type { YAMLScalarTagPolicy } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime"

export const metadataPropertyRule000 = definePropertyTypeRule(
  "StandardAttributeDescriptions",
  "yamlScalarTagPolicy",
  { acceptedTags: ["xml/standard-attributes"] } satisfies YAMLScalarTagPolicy,
)
