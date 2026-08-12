import { EMPTY_XML_TAG_VALUE } from "@nkdk/runtime"
import { defineMetadataRules } from "../../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../../ruleRuntime/definition/testSupport"

export const explicitRowFilterRules = defineMetadataRules({
  ...emptyMetadataRules,
  explicitXMLProperties: {
    tableRowFilter: {
      itemType: "Table",
      propertyKey: "rowFilter",
      yamlValue: EMPTY_XML_TAG_VALUE,
      xmlValue: { "_xsi:nil": "true" },
    },
  },
})
