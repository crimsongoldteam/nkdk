import { XML_PRESENT_TAG_VALUE } from "@nkdk/runtime"

import { defineMetadataRules } from "../../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../../ruleRuntime/definition/testSupport"

export const settingsParameterValueCollectionExplicitEmptyRules = defineMetadataRules({
  ...emptyMetadataRules,
  explicitXMLPropertyTypes: {
    SettingsParameterValueCollection: {
      propertyType: "SettingsParameterValueCollection",
      action: "materializeCollection",
      yamlValue: XML_PRESENT_TAG_VALUE,
    },
  },
})
