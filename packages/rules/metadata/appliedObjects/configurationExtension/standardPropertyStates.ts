import type { MetadataItemRule } from "../../ruleRuntime/property/types"
import { definePropertyStateItemCapabilities } from "./propertyStateCapabilities"

export function defineStandardBorrowedPropertyStates<const Rule extends MetadataItemRule>(
  rule: Rule,
) {
  return definePropertyStateItemCapabilities(rule, {
    profiles: ["borrowed-base", "mutable-synonym"],
    properties: {},
  })
}
