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

export const exportStandardAttributeDescriptionToXML = (
  data: StandardAttributeDescription | undefined,
  configurationSettings: ConfigurationSettings
): StandardAttributeDescriptionXML | undefined => {
  if (!data) return undefined

  return {
    ChoiceForm: data.choiceForm,
    ChoiceHistoryOnInput: data.choiceHistoryOnInput,
    ChoiceParameterLinks: exportChoiceParameterLinksToXML(data.choiceParameterLinks, configurationSettings),
    ChoiceParameters: exportChoiceParameterLinksToXML(data.choiceParameters, configurationSettings),
    Comment: data.comment,
    CreateOnInput: data.createOnInput,
    DataHistory: data.dataHistory,
    EditFormat: exportI8nTextToXML(data.editFormat, configurationSettings),
    ExtendedEdit: data.extendedEdit,
    FillChecking: data.fillChecking,
    FillFromFillingValue: data.fillFromFillingValue,
    FillValue: exportMetadataValueToXML(data.fillValue, configurationSettings),
    Format: exportI8nTextToXML(data.format, configurationSettings),
    FullTextSearch: data.fullTextSearch,
    LinkByType: exportTypeLinkToXML(data.linkByType, configurationSettings),
    MarkNegatives: data.markNegatives,
    Mask: data.mask,
    MaxValue: data.maxValue,
    MinValue: data.minValue,
    MultiLine: data.multiLine,
    Name: data.name,
    PasswordMode: data.passwordMode,
    QuickChoice: data.quickChoice,
    Synonym: exportI8nTextToXML(data.synonym, configurationSettings),
    ToolTip: exportI8nTextToXML(data.toolTip, configurationSettings),
    Type: exportTypeDescriptionToXML(data.type, configurationSettings),
    TypeReductionMode: data.typeReductionMode,
  }
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
