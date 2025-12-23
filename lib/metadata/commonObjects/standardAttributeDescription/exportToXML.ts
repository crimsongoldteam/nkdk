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
  configurationSettings: Context,
  data: StandardAttributeDescription | undefined
): StandardAttributeDescriptionXML | undefined => {
  if (!data) return undefined

  const defaults = getDefaults(data, configurationSettings)
  const mergedData = { ...defaults, ...data }

  const compacted = compactObject({
    "xr:ChoiceForm": mergedData.choiceForm,
    "xr:ChoiceHistoryOnInput": mergedData.choiceHistoryOnInput,
    "xr:ChoiceParameterLinks": exportChoiceParameterLinksToXML(configurationSettings, mergedData.choiceParameterLinks),
    "xr:ChoiceParameters": exportChoiceParameterLinksToXML(configurationSettings, mergedData.choiceParameters),
    "xr:Comment": mergedData.comment,
    "xr:CreateOnInput": mergedData.createOnInput,
    "xr:DataHistory": mergedData.dataHistory,
    "xr:EditFormat": exportI8nTextToXML(configurationSettings, mergedData.editFormat),
    "xr:ExtendedEdit": mergedData.extendedEdit,
    "xr:FillChecking": mergedData.fillChecking,
    "xr:FillFromFillingValue": mergedData.fillFromFillingValue,
    "xr:FillValue": exportMetadataValueToXML(configurationSettings, mergedData.fillValue),
    "xr:Format": exportI8nTextToXML(configurationSettings, mergedData.format),
    "xr:FullTextSearch": mergedData.fullTextSearch,
    "xr:LinkByType": exportTypeLinkToXML(configurationSettings, mergedData.linkByType),
    "xr:MarkNegatives": mergedData.markNegatives,
    "xr:Mask": mergedData.mask,
    "xr:MaxValue": mergedData.maxValue,
    "xr:MinValue": mergedData.minValue,
    "xr:MultiLine": mergedData.multiLine,
    "xr:PasswordMode": mergedData.passwordMode,
    "xr:QuickChoice": mergedData.quickChoice,
    "xr:Synonym": exportI8nTextToXML(configurationSettings, mergedData.synonym),
    "xr:ToolTip": exportI8nTextToXML(configurationSettings, mergedData.toolTip),
    "xr:Type": exportTypeDescriptionToXML(configurationSettings, mergedData.type),
    "xr:TypeReductionMode": mergedData.typeReductionMode,
  })

  return {
    _name: mergedData.name!,
    ...compacted,
  } as StandardAttributeDescriptionXML
}

export const exportStandardAttributeDescriptionsToXML = (
  configurationSettings: Context,
  data: StandardAttributeDescriptions | undefined
): StandardAttributeDescriptionsXML | undefined => {
  if (!data) return undefined

  return data.map(
    (value: StandardAttributeDescription) => exportStandardAttributeDescriptionToXML(configurationSettings, value)!
  )
}
