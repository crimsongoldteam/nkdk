import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportMetadataValueToXML } from "~/lib/metadata/commonObjects/metadataValue/exportToXML"
import { exportTypeDescriptionToXML } from "~/lib/metadata/commonObjects/typeDescription/exportToXML"
import { exportTypeLinkToXML } from "~/lib/metadata/commonObjects/typeLink/exportToXML"
import { exportChoiceParameterLinksToXML } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "../types"

export const exportStandardAttributeDescriptionToXML = (
  data: StandardAttributeDescription | undefined
): StandardAttributeDescriptionXML | undefined => {
  if (!data) return undefined

  return {
    ChoiceForm: data.choiceForm,
    ChoiceHistoryOnInput: data.choiceHistoryOnInput,
    ChoiceParameterLinks: exportChoiceParameterLinksToXML(data.choiceParameterLinks),
    ChoiceParameters: exportChoiceParameterLinksToXML(data.choiceParameters),
    Comment: data.comment,
    CreateOnInput: data.createOnInput,
    DataHistory: data.dataHistory,
    EditFormat: exportI8nTextToXML(data.editFormat),
    ExtendedEdit: data.extendedEdit,
    FillChecking: data.fillChecking,
    FillFromFillingValue: data.fillFromFillingValue,
    FillValue: exportMetadataValueToXML(data.fillValue),
    Format: exportI8nTextToXML(data.format),
    FullTextSearch: data.fullTextSearch,
    LinkByType: exportTypeLinkToXML(data.linkByType),
    MarkNegatives: data.markNegatives,
    Mask: data.mask,
    MaxValue: data.maxValue,
    MinValue: data.minValue,
    MultiLine: data.multiLine,
    Name: data.name,
    PasswordMode: data.passwordMode,
    QuickChoice: data.quickChoice,
    Synonym: exportI8nTextToXML(data.synonym),
    ToolTip: exportI8nTextToXML(data.toolTip),
    Type: exportTypeDescriptionToXML(data.type),
    TypeReductionMode: data.typeReductionMode,
  }
}

registerExport(FormElementType.StandardAttributeDescription, exportStandardAttributeDescriptionToXML)
