import {
  StandardAttributeDescription,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsYAML,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { importPropertiesFromYAML, registerTypeRule } from "~/metadata/orchestration"
import { getDefaults } from "./defaults"
import { StandardAttributeDescriptionRules } from "./rules"

export const importStandardAttributeDescriptionsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: StandardAttributeDescriptionsYAML | undefined
): StandardAttributeDescriptions | undefined => {
  if (!data) return undefined

  const result: StandardAttributeDescriptions = []

  for (const [yamlName, yamlValue] of Object.entries(data)) {
    const withItemType = importPropertiesFromYAML({
      context,
      yaml: yamlValue,
      metadataRule: StandardAttributeDescriptionRules,
      name: yamlName,
    })

    const { itemType: _itemType, ...rest } = withItemType as StandardAttributeDescription & { itemType: string }
    const item: StandardAttributeDescription = { ...rest, itemType: "StandardAttributeDescription" as const }

    const defaults = getDefaults(context, item)
    result.push(removeDefaults(item, defaults))
  }

  if (result.length === 0) return undefined

  return result
}

registerTypeRule("StandardAttributeDescription", "importFromYAML", importStandardAttributeDescriptionsFromYAML)
registerTypeRule("StandardAttributeDescriptions", "importFromYAML", importStandardAttributeDescriptionsFromYAML)
