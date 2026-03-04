import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/toXML"
import { exportMetadataValueToXML } from "~/metadata/commonObjects/metadataValue/toXML"
import {
  StandardAttributeDescription,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsXML,
  StandardAttributeDescriptionXML,
  StandartAttributeName,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import { exportTypeDescriptionToXML } from "~/metadata/commonObjects/typeDescription/toXML"
import { exportTypeLinkToXML } from "~/metadata/commonObjects/typeLink/toXML"
import { exportChoiceParameterLinksToXML } from "~/metadata/commonObjects/сhoiceParameterLinks/toXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule, StandardAttributeDescriptionPropertyRule } from "~/metadata/orchestration"
import { exportChoiceParametersToXML } from "../сhoiceParameters/toXML"
import { getDefaults } from "./defaults"

export const exportStandardAttributeDescriptionsToXML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  data: StandardAttributeDescriptions | undefined
  // standartAttributeNames: StandartAttributeName[]
): StandardAttributeDescriptionsXML | undefined => {
  const narrowRule = rule as StandardAttributeDescriptionPropertyRule
  const extendedData = getExtendedStandardAttributeDescriptions(data ?? [], narrowRule.standartAttributeNames)

  return {
    "xr:StandardAttribute": extendedData.map(
      (value: StandardAttributeDescription) => exportStandardAttributeDescriptionToXML(context, undefined, value)!
    ),
  }
}

const exportStandardAttributeDescriptionToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: StandardAttributeDescription
): StandardAttributeDescriptionXML => {
  const defaults = getDefaults(context, data)
  const mergedData = { ...defaults, ...data }

  const result: StandardAttributeDescriptionXML = {
    _name: mergedData.name!,
  }

  if (mergedData.choiceForm !== undefined) result["xr:ChoiceForm"] = mergedData.choiceForm

  result["xr:ChoiceHistoryOnInput"] = mergedData.choiceHistoryOnInput

  const choiceParameterLinks = exportChoiceParameterLinksToXML(context, undefined, mergedData.choiceParameterLinks)
  if (choiceParameterLinks) result["xr:ChoiceParameterLinks"] = choiceParameterLinks

  const choiceParameters = exportChoiceParametersToXML(context, undefined, mergedData.choiceParameters)
  if (choiceParameters) result["xr:ChoiceParameters"] = choiceParameters

  if (mergedData.comment !== undefined) result["xr:Comment"] = mergedData.comment

  result["xr:CreateOnInput"] = mergedData.createOnInput
  result["xr:DataHistory"] = mergedData.dataHistory

  const editFormat = exportI8nTextToXML(context, { type: "I8nText" }, mergedData.editFormat)
  if (editFormat) result["xr:EditFormat"] = editFormat

  result["xr:ExtendedEdit"] = mergedData.extendedEdit

  result["xr:FillChecking"] = mergedData.fillChecking
  result["xr:FillFromFillingValue"] = mergedData.fillFromFillingValue

  const fillValue = exportMetadataValueToXML(context, undefined, mergedData.fillValue)
  if (fillValue) result["xr:FillValue"] = fillValue

  const format = exportI8nTextToXML(context, { type: "I8nText" }, mergedData.format)
  if (format) result["xr:Format"] = format

  result["xr:FullTextSearch"] = mergedData.fullTextSearch

  const linkByType = exportTypeLinkToXML(context, undefined, mergedData.linkByType)
  if (linkByType) result["xr:LinkByType"] = linkByType

  result["xr:MarkNegatives"] = mergedData.markNegatives

  if (mergedData.mask !== undefined) result["xr:Mask"] = mergedData.mask
  if (mergedData.maxValue !== undefined) result["xr:MaxValue"] = mergedData.maxValue
  if (mergedData.minValue !== undefined) result["xr:MinValue"] = mergedData.minValue

  result["xr:MultiLine"] = mergedData.multiLine

  result["xr:PasswordMode"] = mergedData.passwordMode

  result["xr:QuickChoice"] = mergedData.quickChoice

  const synonym = exportI8nTextToXML(context, { type: "I8nText" }, mergedData.synonym)
  if (synonym !== undefined) result["xr:Synonym"] = synonym

  const toolTip = exportI8nTextToXML(context, { type: "I8nText" }, mergedData.toolTip)
  if (toolTip !== undefined) result["xr:ToolTip"] = toolTip

  const type = exportTypeDescriptionToXML(context, undefined, mergedData.type)
  if (type) result["xr:Type"] = type

  result["xr:TypeReductionMode"] = mergedData.typeReductionMode

  return result
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

    if (existingItem) {
      result.push(existingItem)
      continue
    }

    const defaultItem: StandardAttributeDescription = {
      name,
    }
    result.push(defaultItem)
  }

  return result
}

registerTypeRule("StandardAttributeDescription", "exportToXML", exportStandardAttributeDescriptionsToXML)
