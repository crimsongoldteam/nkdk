import type { YAMLScalarTagPolicy } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../../ruleRuntime"

export const metadataPropertyRule000 = definePropertyTypeRule(
  "DcsLocalStringType",
  "yamlScalarTagPolicy",
  { acceptedTags: ["xml/string"] } satisfies YAMLScalarTagPolicy,
)
