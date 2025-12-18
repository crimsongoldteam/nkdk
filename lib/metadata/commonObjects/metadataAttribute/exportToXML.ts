import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import {
  MetadataAttribute,
  MetadataAttributes,
  MetadataAttributesXML,
  MetadataAttributeXML,
} from "~/lib/metadata/commonObjects/metadataAttribute/types"
import { exportMetadataValueToXML } from "~/lib/metadata/commonObjects/metadataValue/exportToXML"
import { exportTypeDescriptionToXML } from "~/lib/metadata/commonObjects/typeDescription/exportToXML"
import { exportTypeLinkToXML } from "~/lib/metadata/commonObjects/typeLink/exportToXML"
import { exportChoiceParameterLinksToXML } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"

export const exportMetadataAttributeToXML = (
  data: MetadataAttribute | undefined,
  configurationSettings: ConfigurationSettings
): MetadataAttributeXML | undefined => {
  if (!data) return undefined

  return compactObject({
    BinaryDataStorageLocationUse: data.binaryDataStorageLocationUse,
    BinaryDataStorageLocationUseField: data.binaryDataStorageLocationUseField,
    ChoiceFoldersAndItems: data.choiceFoldersAndItems,
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
    FillingValue: exportMetadataValueToXML(data.fillingValue, configurationSettings),
    Format: exportI8nTextToXML(data.format, configurationSettings),
    FullTextSearch: data.fullTextSearch,
    Indexing: data.indexing,
    LinkByType: exportTypeLinkToXML(data.linkByType, configurationSettings),
    MarkNegatives: data.markNegatives,
    Mask: data.mask,
    MaxValue: data.maxValue,
    MinValue: data.minValue,
    MultiLine: data.multiLine,
    Name: data.name,
    ObjectBelonging: data.objectBelonging,
    PasswordMode: data.passwordMode,
    QuickChoice: data.quickChoice,
    Synonym: exportI8nTextToXML(data.synonym, configurationSettings),
    Tooltip: exportI8nTextToXML(data.tooltip, configurationSettings),
    Type: exportTypeDescriptionToXML(data.type, configurationSettings),
    Use: data.use,
  })
}

export const exportMetadataAttributesToXML = (
  data: MetadataAttributes | undefined,
  configurationSettings: ConfigurationSettings
): MetadataAttributesXML | undefined => {
  if (!data) return undefined

  return data.map((value: MetadataAttribute) => exportMetadataAttributeToXML(value, configurationSettings)!)
}
