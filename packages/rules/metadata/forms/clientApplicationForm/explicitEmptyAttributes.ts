import { XML_PRESENT_TAG_VALUE } from "@nkdk/runtime"
import { defineMetadataRules } from "../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../ruleRuntime/definition/testSupport"

export const explicitEmptyAttributesRules = defineMetadataRules({
  ...emptyMetadataRules,
  explicitXMLProperties: {
    clientApplicationFormAttributes: {
      itemType: "ClientApplicationForm",
      propertyKey: "attributes",
      yamlValue: XML_PRESENT_TAG_VALUE,
      xmlValue: {},
    },
  },
})
