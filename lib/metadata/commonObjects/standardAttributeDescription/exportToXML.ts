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
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"

export const exportStandardAttributeDescriptionToXML = (
  data: StandardAttributeDescription | undefined,
  configurationSettings: ConfigurationSettings
): StandardAttributeDescriptionXML | undefined => {
  if (!data) return undefined

  const compacted = compactObject({
    "xr:ChoiceForm": data.choiceForm,
    "xr:ChoiceHistoryOnInput": data.choiceHistoryOnInput,
    "xr:ChoiceParameterLinks": exportChoiceParameterLinksToXML(data.choiceParameterLinks, configurationSettings),
    "xr:ChoiceParameters": exportChoiceParameterLinksToXML(data.choiceParameters, configurationSettings),
    "xr:Comment": data.comment,
    "xr:CreateOnInput": data.createOnInput,
    "xr:DataHistory": data.dataHistory,
    "xr:EditFormat": exportI8nTextToXML(data.editFormat, configurationSettings),
    "xr:ExtendedEdit": data.extendedEdit,
    "xr:FillChecking": data.fillChecking,
    "xr:FillFromFillingValue": data.fillFromFillingValue,
    "xr:FillValue": exportMetadataValueToXML(data.fillValue, configurationSettings),
    "xr:Format": exportI8nTextToXML(data.format, configurationSettings),
    "xr:FullTextSearch": data.fullTextSearch,
    "xr:LinkByType": exportTypeLinkToXML(data.linkByType, configurationSettings),
    "xr:MarkNegatives": data.markNegatives,
    "xr:Mask": data.mask,
    "xr:MaxValue": data.maxValue,
    "xr:MinValue": data.minValue,
    "xr:MultiLine": data.multiLine,
    "xr:PasswordMode": data.passwordMode,
    "xr:QuickChoice": data.quickChoice,
    "xr:Synonym": exportI8nTextToXML(data.synonym, configurationSettings),
    "xr:ToolTip": exportI8nTextToXML(data.toolTip, configurationSettings),
    "xr:Type": exportTypeDescriptionToXML(data.type, configurationSettings),
    "xr:TypeReductionMode": data.typeReductionMode,
  })

  return {
    _name: data.name!,
    ...compacted,
  } as StandardAttributeDescriptionXML
}

export const exportStandardAttributeDescriptionsToXML = (
  data: StandardAttributeDescriptions | undefined,
  configurationSettings: ConfigurationSettings
): StandardAttributeDescriptionsXML | undefined => {
  if (!data) return undefined

  return data.map(
    (value: StandardAttributeDescription) => exportStandardAttributeDescriptionToXML(value, configurationSettings)!
  )
}
