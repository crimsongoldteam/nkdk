import {
  StandardAttributeDescription,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsXML,
  StandardAttributeDescriptionXML,
  StandartAttributeName,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import {
  exportMetadataItemToXML,
  registerTypeRule,
  StandardAttributeDescriptionPropertyRule,
  StandardAttributeDescriptionsPropertyRule,
} from "~/metadata/orchestration"
import { getDefaults } from "./defaults"
import { StandardAttributeDescriptionRules } from "./rules"

export const exportStandardAttributeDescriptionsToXML = (
  context: ConfigurationContextWithExportToXML,
  rule: PropertyRule,
  data: StandardAttributeDescriptions | undefined
): StandardAttributeDescriptionsXML | undefined => {
  const narrowRule = rule as StandardAttributeDescriptionPropertyRule | StandardAttributeDescriptionsPropertyRule
  const extendedData = getExtendedStandardAttributeDescriptions(data ?? [], narrowRule.standartAttributeNames)

  return {
    "xr:StandardAttribute": extendedData.map((value: StandardAttributeDescription) =>
      exportStandardAttributeDescriptionToXML(context, value)
    ),
  }
}

const exportStandardAttributeDescriptionToXML = (
  context: ConfigurationContextWithExportToXML,
  data: StandardAttributeDescription
): StandardAttributeDescriptionXML => {
  const defaults = getDefaults(context, data)
  const mergedData = { ...defaults, ...data }

  const flat = exportMetadataItemToXML({
    context,
    data: mergedData,
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
    dataMap.set(item.name as StandartAttributeName, item)
  }

  const result: StandardAttributeDescriptions = []
  for (const name of standartAttributeNames) {
    const existingItem = dataMap.get(name)
    result.push(existingItem ?? { name, itemType: StandardAttributeDescriptionRules.itemType })
  }
  return result
}

registerTypeRule("StandardAttributeDescriptions", "exportToXML", exportStandardAttributeDescriptionsToXML)
