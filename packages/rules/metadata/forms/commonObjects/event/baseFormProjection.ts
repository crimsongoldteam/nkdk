import { defineMetadataRules } from "../../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../../ruleRuntime/definition/testSupport"

export const eventBaseFormProjectionRules = defineMetadataRules({
  ...emptyMetadataRules,
  operations: [{
    kind: "baseFormPropertyProjector",
    propertyType: "Events",
    projector: { project: () => ({ kind: "omit" }) },
  }],
})
