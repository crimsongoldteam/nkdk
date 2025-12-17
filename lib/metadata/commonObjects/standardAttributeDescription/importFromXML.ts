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

export const importStandardAttributeDescriptionFromXML = (
  xml: StandardAttributeDescriptionXML | undefined
): StandardAttributeDescription | undefined => {
  if (!xml) return undefined

  return {
    choiceForm: xml.ChoiceForm,
    choiceHistoryOnInput: xml.ChoiceHistoryOnInput,
    choiceParameterLinks: importChoiceParameterLinksFromXML(xml.ChoiceParameterLinks),
    choiceParameters: importChoiceParameterLinksFromXML(xml.ChoiceParameters),
    comment: xml.Comment,
    createOnInput: xml.CreateOnInput,
    dataHistory: xml.DataHistory,
    editFormat: importI8nTextFromXML(xml.EditFormat),
    extendedEdit: xml.ExtendedEdit,
    fillChecking: xml.FillChecking,
    fillFromFillingValue: xml.FillFromFillingValue,
    fillValue: importMetadataValueFromXML(xml.FillValue),
    format: importI8nTextFromXML(xml.Format),
    fullTextSearch: xml.FullTextSearch,
    linkByType: importTypeLinkFromXML(xml.LinkByType),
    markNegatives: xml.MarkNegatives,
    mask: xml.Mask,
    maxValue: xml.MaxValue,
    minValue: xml.MinValue,
    multiLine: xml.MultiLine,
    name: xml.Name,
    passwordMode: xml.PasswordMode,
    quickChoice: xml.QuickChoice,
    synonym: importI8nTextFromXML(xml.Synonym),
    toolTip: importI8nTextFromXML(xml.ToolTip),
    type: importTypeDescriptionFromXML(xml.Type),
    typeReductionMode: xml.TypeReductionMode,
  }
}

export const importStandardAttributeDescriptionsFromXML = (
  xml: StandardAttributeDescriptionsXML | undefined
): StandardAttributeDescriptions | undefined => {
  if (!xml) return undefined

  return xml.map((value: StandardAttributeDescriptionXML) => importStandardAttributeDescriptionFromXML(value)!)
}
