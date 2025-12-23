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
  configurationSettings: ConfigurationSettings,
  data: StandardAttributeDescription | undefined
): StandardAttributeDescriptionXML | undefined => {
  if (!data) return undefined

  const compacted = compactObject({
    "xr:ChoiceForm": data.choiceForm,
    "xr:ChoiceHistoryOnInput": data.choiceHistoryOnInput,
    "xr:ChoiceParameterLinks": exportChoiceParameterLinksToXML(configurationSettings, data.choiceParameterLinks),
    "xr:ChoiceParameters": exportChoiceParameterLinksToXML(configurationSettings, data.choiceParameters),
    "xr:Comment": data.comment,
    "xr:CreateOnInput": data.createOnInput,
    "xr:DataHistory": data.dataHistory,
    "xr:EditFormat": exportI8nTextToXML(configurationSettings, data.editFormat),
    "xr:ExtendedEdit": data.extendedEdit,
    "xr:FillChecking": data.fillChecking,
    "xr:FillFromFillingValue": data.fillFromFillingValue,
    "xr:FillValue": exportMetadataValueToXML(configurationSettings, data.fillValue),
    "xr:Format": exportI8nTextToXML(configurationSettings, data.format),
    "xr:FullTextSearch": data.fullTextSearch,
    "xr:LinkByType": exportTypeLinkToXML(configurationSettings, data.linkByType),
    "xr:MarkNegatives": data.markNegatives,
    "xr:Mask": data.mask,
    "xr:MaxValue": data.maxValue,
    "xr:MinValue": data.minValue,
    "xr:MultiLine": data.multiLine,
    "xr:PasswordMode": data.passwordMode,
    "xr:QuickChoice": data.quickChoice,
    "xr:Synonym": exportI8nTextToXML(configurationSettings, data.synonym),
    "xr:ToolTip": exportI8nTextToXML(configurationSettings, data.toolTip),
    "xr:Type": exportTypeDescriptionToXML(configurationSettings, data.type),
    "xr:TypeReductionMode": data.typeReductionMode,
  })

  return {
    _name: data.name!,
    ...compacted,
  } as StandardAttributeDescriptionXML
}

export const exportStandardAttributeDescriptionsToXML = (
  configurationSettings: ConfigurationSettings,
  data: StandardAttributeDescriptions | undefined
): StandardAttributeDescriptionsXML | undefined => {
  if (!data) return undefined

  return data.map(
    (value: StandardAttributeDescription) => exportStandardAttributeDescriptionToXML(configurationSettings, value)!
  )
}
