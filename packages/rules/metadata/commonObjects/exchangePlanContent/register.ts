import { XML_PRESENT_TAG_VALUE } from "@nkdk/runtime"

export const exchangePlanContentExplicitXMLPropertyTypes = {
  ExchangePlanContent: {
    propertyType: "ExchangePlanContent",
    action: "materializeCollection",
    yamlValue: XML_PRESENT_TAG_VALUE,
  },
} as const
