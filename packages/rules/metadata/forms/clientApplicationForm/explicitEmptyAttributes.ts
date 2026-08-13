import { EMPTY_XML_TAG_VALUE } from "@nkdk/runtime"
import { defineMetadataRules } from "../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../ruleRuntime/definition/testSupport"

export const explicitEmptyAttributesRules = defineMetadataRules({
  ...emptyMetadataRules,
  explicitXMLProperties: {
    clientApplicationFormAttributes: {
      itemType: "ClientApplicationForm",
      propertyKey: "attributes",
      yamlValue: EMPTY_XML_TAG_VALUE,
      xmlValue: {},
    },
  },
})
