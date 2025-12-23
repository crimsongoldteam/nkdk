import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportMetadataValueToXML } from "~/lib/metadata/commonObjects/metadataValue/exportToXML"
import {
  StandardAttributeDescription,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsXML,
  StandardAttributeDescriptionXML,
} from "~/lib/metadata/commonObjects/standardAttributeDescription/types"
import { exportTypeDescriptionToXML } from "~/lib/metadata/commonObjects/typeDescription/exportToXML"
import { exportTypeLinkToXML } from "~/lib/metadata/commonObjects/typeLink/exportToXML"
import { exportChoiceParameterLinksToXML } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/exportToXML"
import { Context } from "~/lib/metadata/context/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { getDefaults } from "./defaults"

export const exportStandardAttributeDescriptionToXML = (
  context: Context,
  data: StandardAttributeDescription | undefined
): StandardAttributeDescriptionXML | undefined => {
  if (!data) return undefined

  const defaults = getDefaults(data, context)
  const mergedData = { ...defaults, ...data }

  const compacted = compactObject({
    "xr:ChoiceForm": mergedData.choiceForm,
    "xr:ChoiceHistoryOnInput": mergedData.choiceHistoryOnInput,
    "xr:ChoiceParameterLinks": exportChoiceParameterLinksToXML(context, mergedData.choiceParameterLinks),
    "xr:ChoiceParameters": exportChoiceParameterLinksToXML(context, mergedData.choiceParameters),
    "xr:Comment": mergedData.comment,
    "xr:CreateOnInput": mergedData.createOnInput,
    "xr:DataHistory": mergedData.dataHistory,
    "xr:EditFormat": exportI8nTextToXML(context, mergedData.editFormat),
    "xr:ExtendedEdit": mergedData.extendedEdit,
    "xr:FillChecking": mergedData.fillChecking,
    "xr:FillFromFillingValue": mergedData.fillFromFillingValue,
    "xr:FillValue": exportMetadataValueToXML(context, mergedData.fillValue),
    "xr:Format": exportI8nTextToXML(context, mergedData.format),
    "xr:FullTextSearch": mergedData.fullTextSearch,
    "xr:LinkByType": exportTypeLinkToXML(context, mergedData.linkByType),
    "xr:MarkNegatives": mergedData.markNegatives,
    "xr:Mask": mergedData.mask,
    "xr:MaxValue": mergedData.maxValue,
    "xr:MinValue": mergedData.minValue,
    "xr:MultiLine": mergedData.multiLine,
    "xr:PasswordMode": mergedData.passwordMode,
    "xr:QuickChoice": mergedData.quickChoice,
    "xr:Synonym": exportI8nTextToXML(context, mergedData.synonym),
    "xr:ToolTip": exportI8nTextToXML(context, mergedData.toolTip),
    "xr:Type": exportTypeDescriptionToXML(context, mergedData.type),
    "xr:TypeReductionMode": mergedData.typeReductionMode,
  })

  return {
    _name: mergedData.name!,
    ...compacted,
  } as StandardAttributeDescriptionXML
}

export const exportStandardAttributeDescriptionsToXML = (
  context: Context,
  data: StandardAttributeDescriptions | undefined
): StandardAttributeDescriptionsXML | undefined => {
  if (!data) return undefined

  return data.map((value: StandardAttributeDescription) => exportStandardAttributeDescriptionToXML(context, value)!)
}
