import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importMetadataValueFromXML } from "~/lib/metadata/commonObjects/metadataValue/importFromXML"
import {
  StandardAttributeDescription,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsXML,
  StandardAttributeDescriptionXML,
} from "~/lib/metadata/commonObjects/standardAttributeDescription/types"
import { importTypeDescriptionFromXML } from "~/lib/metadata/commonObjects/typeDescription/importFromXML"
import { importTypeLinkFromXML } from "~/lib/metadata/commonObjects/typeLink/importFromXML"
import { importChoiceParameterLinksFromXML } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"

export const importStandardAttributeDescriptionFromXML = (
  xml: StandardAttributeDescriptionXML | undefined,
  configurationSettings: ConfigurationSettings
): StandardAttributeDescription | undefined => {
  if (!xml) return undefined

  return {
    choiceForm: xml.ChoiceForm,
    choiceHistoryOnInput: xml.ChoiceHistoryOnInput,
    choiceParameterLinks: importChoiceParameterLinksFromXML(xml.ChoiceParameterLinks, configurationSettings),
    choiceParameters: importChoiceParameterLinksFromXML(xml.ChoiceParameters, configurationSettings),
    comment: xml.Comment,
    createOnInput: xml.CreateOnInput,
    dataHistory: xml.DataHistory,
    editFormat: importI8nTextFromXML(xml.EditFormat, configurationSettings),
    extendedEdit: xml.ExtendedEdit,
    fillChecking: xml.FillChecking,
    fillFromFillingValue: xml.FillFromFillingValue,
    fillValue: importMetadataValueFromXML(xml.FillValue, configurationSettings),
    format: importI8nTextFromXML(xml.Format, configurationSettings),
    fullTextSearch: xml.FullTextSearch,
    linkByType: importTypeLinkFromXML(xml.LinkByType, configurationSettings),
    markNegatives: xml.MarkNegatives,
    mask: xml.Mask,
    maxValue: xml.MaxValue,
    minValue: xml.MinValue,
    multiLine: xml.MultiLine,
    name: xml.Name,
    passwordMode: xml.PasswordMode,
    quickChoice: xml.QuickChoice,
    synonym: importI8nTextFromXML(xml.Synonym, configurationSettings),
    toolTip: importI8nTextFromXML(xml.ToolTip, configurationSettings),
    type: importTypeDescriptionFromXML(xml.Type, configurationSettings),
    typeReductionMode: xml.TypeReductionMode,
  }
}

export const importStandardAttributeDescriptionsFromXML = (
  xml: StandardAttributeDescriptionsXML | undefined,
  configurationSettings: ConfigurationSettings
): StandardAttributeDescriptions | undefined => {
  if (!xml) return undefined

  return xml.map(
    (value: StandardAttributeDescriptionXML) => importStandardAttributeDescriptionFromXML(value, configurationSettings)!
  )
}
