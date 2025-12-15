import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportTypeDescriptionToXML } from "~/lib/metadata/commonObjects/typeDescription/exportToXML"
import { exportChoiceParameterLinksToXML } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "../types"

export const exportMetadataAttributeToXML = (data: MetadataAttribute | undefined): MetadataAttributeXML | undefined => {
  if (!data) return undefined

  return {
    BinaryDataStorageLocationUse: data.binaryDataStorageLocationUse,
    BinaryDataStorageLocationUseField: data.binaryDataStorageLocationUseField,
    ChoiceFoldersAndItems: data.choiceFoldersAndItems,
    ChoiceForm: data.choiceForm,
    ChoiceHistoryOnInput: data.choiceHistoryOnInput,
    ChoiceParameterLinks: exportChoiceParameterLinksToXML(data.choiceParameterLinks),
    ChoiceParameters: exportChoiceParameterLinksToXML(data.choiceParameters),
    Comment: data.comment,
    CreateOnInput: data.createOnInput,
    DataHistory: data.dataHistory,
    EditFormat: exportI8nTextToXML(data.editFormat),
    ExtendedConfigurationObject: data.extendedConfigurationObject,
    ExtendedEdit: data.extendedEdit,
    FillChecking: data.fillChecking,
    FillFromFillingValue: data.fillFromFillingValue,
    FillingValue: data.fillingValue,
    Format: exportI8nTextToXML(data.format),
    FullTextSearch: data.fullTextSearch,
    Indexing: data.indexing,
    LinkByType: data.linkByType,
    MarkNegatives: data.markNegatives,
    Mask: data.mask,
    MaxValue: data.maxValue,
    MinValue: data.minValue,
    MultiLine: data.multiLine,
    ObjectBelonging: data.objectBelonging,
    PasswordMode: data.passwordMode,
    QuickChoice: data.quickChoice,
    Synonym: data.synonym,
    Tooltip: data.tooltip,
    Type: exportTypeDescriptionToXML(data.type),
    Use: data.use,
  }
}

registerExport(FormElementType.MetadataAttribute, exportMetadataAttributeToXML)
