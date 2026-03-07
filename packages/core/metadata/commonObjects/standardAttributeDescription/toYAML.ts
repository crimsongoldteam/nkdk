import {
  StandardAttributeDescriptionYAML,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsYAML,
  StandartAttributeNameToYAML,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { exportPropertiesToYAML, registerTypeRule } from "~/metadata/orchestration"
import { StandardAttributeDescriptionRules } from "./rules"

export const exportStandardAttributeDescriptionsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: StandardAttributeDescriptions | undefined
): StandardAttributeDescriptionsYAML | undefined => {
  if (!data) return undefined

  const result: StandardAttributeDescriptionsYAML = {}

  for (const item of data) {
    const yamlItem = exportPropertiesToYAML({
      context,
      data: item,
      rule: StandardAttributeDescriptionRules,
    })

    const yamlKey = StandartAttributeNameToYAML[item.name]
    result[yamlKey] = (yamlItem ?? {}) as StandardAttributeDescriptionYAML
  }

  if (Object.keys(result).length === 0) return undefined

  return result
}

registerTypeRule("StandardAttributeDescription", "exportToYAML", exportStandardAttributeDescriptionsToYAML)
