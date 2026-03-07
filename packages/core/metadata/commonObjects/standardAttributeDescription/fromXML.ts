import {
  StandardAttributeDescription,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsXML,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { importPropertiesFromXML, registerTypeRule } from "~/metadata/orchestration"
import { StandardAttributeDescriptionRules } from "./rules"

export const importStandardAttributeDescriptionsFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: StandardAttributeDescriptionsXML | undefined
): StandardAttributeDescriptions | undefined => {
  if (!xml) return undefined

  const xrStandardAttribute = xml["xr:StandardAttribute"]
  const items = Array.isArray(xrStandardAttribute) ? xrStandardAttribute : [xrStandardAttribute]

  const result: StandardAttributeDescriptions = []

  for (const xmlItem of items) {
    const properties = importPropertiesFromXML<
      StandardAttributeDescription & { itemType: "StandardAttributeDescription" }
    >({
      context,
      xml: xmlItem,
      rule: StandardAttributeDescriptionRules,
    })

    if (!properties) continue

    if (Object.keys(properties).length === 1 && properties.name !== undefined) continue

    const item: StandardAttributeDescription = { ...properties, itemType: "StandardAttributeDescription" as const }

    result.push(item)
  }

  if (result.length === 0) return undefined

  return result
}

registerTypeRule("StandardAttributeDescriptions", "importFromXML", importStandardAttributeDescriptionsFromXML)
