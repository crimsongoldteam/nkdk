import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportMetadataValueToXML } from "~/metadata/commonObjects/metadataValue/exportToXML"
import {
  StandardAttributeDescription,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsXML,
  StandardAttributeDescriptionXML,
  StandartAttributeName,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import { exportTypeDescriptionToXML } from "~/metadata/commonObjects/typeDescription/exportToXML"
import { exportTypeLinkToXML } from "~/metadata/commonObjects/typeLink/exportToXML"
import { exportChoiceParameterLinksToXML } from "~/metadata/commonObjects/сhoiceParameterLinks/exportToXML"
import { Context } from "~/metadata/context/types"
import { getDefaults } from "./defaults"

export const exportStandardAttributeDescriptionsToXML = (
  context: Context,
  data: StandardAttributeDescriptions | undefined,
  standartAttributeNames: StandartAttributeName[]
): StandardAttributeDescriptionsXML | undefined => {
  const extendedData = getExtendedStandardAttributeDescriptions(data ?? [], standartAttributeNames)

  return {
    "xr:StandardAttribute": extendedData.map(
      (value: StandardAttributeDescription) => exportStandardAttributeDescriptionToXML(context, value)!
    ),
  }
}

const exportStandardAttributeDescriptionToXML = (
  context: Context,
  data: StandardAttributeDescription
): StandardAttributeDescriptionXML => {
  const defaults = getDefaults(data, context)
  const mergedData = { ...defaults, ...data }

  const result: StandardAttributeDescriptionXML = {
    _name: mergedData.name!,
  }

  if (mergedData.choiceForm !== undefined) result["xr:ChoiceForm"] = mergedData.choiceForm

  result["xr:ChoiceHistoryOnInput"] = mergedData.choiceHistoryOnInput

  const choiceParameters = exportChoiceParameterLinksToXML(context, mergedData.choiceParameters)
  if (choiceParameters) result["xr:ChoiceParameters"] = choiceParameters

  const choiceParameterLinks = exportChoiceParameterLinksToXML(context, mergedData.choiceParameterLinks)
  if (choiceParameterLinks) result["xr:ChoiceParameterLinks"] = choiceParameterLinks

  if (mergedData.comment !== undefined) result["xr:Comment"] = mergedData.comment

  result["xr:CreateOnInput"] = mergedData.createOnInput
  result["xr:DataHistory"] = mergedData.dataHistory

  const editFormat = exportI8nTextToXML(context, mergedData.editFormat)
  if (editFormat) result["xr:EditFormat"] = editFormat

  result["xr:ExtendedEdit"] = mergedData.extendedEdit

  result["xr:FillChecking"] = mergedData.fillChecking
  result["xr:FillFromFillingValue"] = mergedData.fillFromFillingValue

  const fillValue = exportMetadataValueToXML(context, mergedData.fillValue)
  if (fillValue) result["xr:FillValue"] = fillValue

  const format = exportI8nTextToXML(context, mergedData.format)
  if (format) result["xr:Format"] = format

  result["xr:FullTextSearch"] = mergedData.fullTextSearch

  const linkByType = exportTypeLinkToXML(context, mergedData.linkByType)
  if (linkByType) result["xr:LinkByType"] = linkByType

  result["xr:MarkNegatives"] = mergedData.markNegatives

  if (mergedData.mask !== undefined) result["xr:Mask"] = mergedData.mask
  if (mergedData.maxValue !== undefined) result["xr:MaxValue"] = mergedData.maxValue
  if (mergedData.minValue !== undefined) result["xr:MinValue"] = mergedData.minValue

  result["xr:MultiLine"] = mergedData.multiLine

  result["xr:PasswordMode"] = mergedData.passwordMode

  result["xr:QuickChoice"] = mergedData.quickChoice

  const synonym = exportI8nTextToXML(context, mergedData.synonym)
  if (synonym !== undefined) result["xr:Synonym"] = synonym

  const toolTip = exportI8nTextToXML(context, mergedData.toolTip)
  if (toolTip !== undefined) result["xr:ToolTip"] = toolTip

  const type = exportTypeDescriptionToXML(context, mergedData.type)
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
