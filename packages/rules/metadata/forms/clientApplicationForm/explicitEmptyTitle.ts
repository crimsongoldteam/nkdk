import { EMPTY_XML_TAG_VALUE } from "@nkdk/runtime"
import { defineMetadataRules } from "../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../ruleRuntime/definition/testSupport"

export const explicitEmptyFormElementTitleRules = defineMetadataRules({
  ...emptyMetadataRules,
  explicitXMLProperties: {
    labelDecorationTitle: {
      itemType: "LabelDecoration",
      propertyKey: "title",
      yamlValue: EMPTY_XML_TAG_VALUE,
      xmlValue: { _formatted: "true" },
    },
    extendedTooltipTitle: {
      itemType: "ExtendedTooltip",
      propertyKey: "title",
      yamlValue: EMPTY_XML_TAG_VALUE,
      xmlValue: { _formatted: "true" },
    },
  },
})
