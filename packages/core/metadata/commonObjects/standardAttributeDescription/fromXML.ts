import {
  StandardAttributeDescription,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsXML,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { importMetadataItemFromXML, registerTypeRule } from "~/metadata/orchestration"
import { StandardAttributeDescriptionRules } from "./rules"
import { ConfigurationContextFromXML } from "~/metadata/context/types"

export const importStandardAttributeDescriptionsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: StandardAttributeDescriptionsXML | undefined
): StandardAttributeDescriptions | undefined => {
  if (!xml) return undefined

  const xrStandardAttribute = xml["xr:StandardAttribute"]
  const items = Array.isArray(xrStandardAttribute) ? xrStandardAttribute : [xrStandardAttribute]

  const result: StandardAttributeDescriptions = []

  for (const xmlItem of items) {
    const item = importMetadataItemFromXML({
      context,
      xml: xmlItem,
      rule: StandardAttributeDescriptionRules,
    })

    if (!item) continue

    if (Object.keys(item).length === 2 && item.name !== undefined) continue

    result.push(item as StandardAttributeDescription)
  }

  if (result.length === 0) return undefined

  return result
}

registerTypeRule("StandardAttributeDescriptions", "importFromXML", importStandardAttributeDescriptionsFromXML)
