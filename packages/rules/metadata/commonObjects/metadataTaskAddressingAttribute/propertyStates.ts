import { allPropertyStateModes, controlled, definePropertyStateItemCapabilities } from "../../ruleRuntime/definition/propertyStateDeclarations"
import { MetadataTaskAddressingAttributeRules } from "./rules"

export const metadataTaskAddressingAttributePropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataTaskAddressingAttributeRules, {
  itemType: "MetadataTaskAddressingAttribute",
  profiles: ["borrowed-base", "register-field"],
  properties: {
    ...controlled("type"),
    ...allPropertyStateModes("addressingDimension"),
  },
})
