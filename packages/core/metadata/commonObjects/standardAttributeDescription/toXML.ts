import {
  StandardAttributeDescription,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsXML,
  StandardAttributeDescriptionXML,
  StandartAttributeName,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { exportPropertiesToXML, registerTypeRule, StandardAttributeDescriptionPropertyRule } from "~/metadata/orchestration"
import { getDefaults } from "./defaults"
import { StandardAttributeDescriptionRules } from "./rules"

export const exportStandardAttributeDescriptionsToXML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  data: StandardAttributeDescriptions | undefined
): StandardAttributeDescriptionsXML | undefined => {
  const narrowRule = rule as StandardAttributeDescriptionPropertyRule
  const extendedData = getExtendedStandardAttributeDescriptions(data ?? [], narrowRule.standartAttributeNames)

  return {
    "xr:StandardAttribute": extendedData.map((value: StandardAttributeDescription) =>
      exportStandardAttributeDescriptionToXML(context, value)
    ),
  }
}

const exportStandardAttributeDescriptionToXML = (
  context: ConfigurationContext,
  data: StandardAttributeDescription
): StandardAttributeDescriptionXML => {
  const defaults = getDefaults(context, data)
  const mergedData = { ...defaults, ...data }

  const flat = exportPropertiesToXML({
    context,
    metadataItem: { ...mergedData, itemType: "StandardAttributeDescription" as const },
    rule: StandardAttributeDescriptionRules,
  })

  return flat as StandardAttributeDescriptionXML
}

const getExtendedStandardAttributeDescriptions = (
  data: StandardAttributeDescriptions,
  standartAttributeNames: StandartAttributeName[]
): StandardAttributeDescriptions => {
  const dataMap = new Map<StandartAttributeName, StandardAttributeDescription>()
  for (const item of data) {
    dataMap.set(item.name, item)
  }

  const result: StandardAttributeDescriptions = []
  for (const name of standartAttributeNames) {
    const existingItem = dataMap.get(name)
    result.push(existingItem ?? { name })
  }
  return result
}

registerTypeRule("StandardAttributeDescription", "exportToXML", exportStandardAttributeDescriptionsToXML)
