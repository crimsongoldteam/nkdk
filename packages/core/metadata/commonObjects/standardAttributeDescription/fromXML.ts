import {
  StandardAttributeDescription,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsXML,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { importPropertiesFromXML, registerTypeRule } from "~/metadata/orchestration"
import { getDefaults } from "./defaults"
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

    const item: StandardAttributeDescription = { ...properties, itemType: "StandardAttributeDescription" as const }
    const defaults = getDefaults(context, item)
    const itemWithoutDefaults = removeDefaults(item, defaults)

    if (Object.keys(itemWithoutDefaults).length === 1) continue

    result.push(itemWithoutDefaults)
  }

  if (result.length === 0) return undefined

  return result
}

registerTypeRule("StandardAttributeDescriptions", "importFromXML", importStandardAttributeDescriptionsFromXML)
