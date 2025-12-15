import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importMetadataValueFromXML } from "~/lib/metadata/commonObjects/metadataValue/importFromXML"
import { importTypeDescriptionFromXML } from "~/lib/metadata/commonObjects/typeDescription/importFromXML"
import { importTypeLinkFromXML } from "~/lib/metadata/commonObjects/typeLink/importFromXML"
import { importChoiceParameterLinksFromXML } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { FormElementType } from "../types"

export const importMetadataAttributeFromXML = (
  xml: MetadataAttributeXML | undefined
): MetadataAttribute | undefined => {
  if (!xml) return undefined

  return {
    elementType: FormElementType.MetadataAttribute,

    binaryDataStorageLocationUse: xml.BinaryDataStorageLocationUse,
    binaryDataStorageLocationUseField: xml.BinaryDataStorageLocationUseField,
    choiceFoldersAndItems: xml.ChoiceFoldersAndItems,
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
    fillingValue: importMetadataValueFromXML(xml.FillingValue),
    format: importI8nTextFromXML(xml.Format),
    fullTextSearch: xml.FullTextSearch,
    indexing: xml.Indexing,
    linkByType: importTypeLinkFromXML(xml.LinkByType),
    markNegatives: xml.MarkNegatives,
    mask: xml.Mask,
    maxValue: xml.MaxValue,
    minValue: xml.MinValue,
    multiLine: xml.MultiLine,
    name: xml.Name,
    objectBelonging: xml.ObjectBelonging,
    passwordMode: xml.PasswordMode,
    quickChoice: xml.QuickChoice,
    synonym: importI8nTextFromXML(xml.Synonym),
    tooltip: importI8nTextFromXML(xml.Tooltip),
    type: importTypeDescriptionFromXML(xml.Type),
    use: xml.Use,
  }
}

registerImport(FormElementType.MetadataAttribute, importMetadataAttributeFromXML)
