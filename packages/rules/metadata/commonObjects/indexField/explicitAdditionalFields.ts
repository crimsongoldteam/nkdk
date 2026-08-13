import { EMPTY_XML_TAG_VALUE } from "@nkdk/runtime"
import { defineMetadataRules } from "../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../ruleRuntime/definition/testSupport"

export const explicitAdditionalFieldsRules = defineMetadataRules({
  ...emptyMetadataRules,
  explicitXMLProperties: {
    indexAdditionalFields: {
      itemType: "IndexField",
      propertyKey: "additionalFields",
      yamlValue: EMPTY_XML_TAG_VALUE,
      xmlValue: {},
    },
    additionalIndexItemAdditionalFields: {
      itemType: "AdditionalIndexItem",
      propertyKey: "additionalFields",
      yamlValue: EMPTY_XML_TAG_VALUE,
      xmlValue: {},
    },
  },
})
