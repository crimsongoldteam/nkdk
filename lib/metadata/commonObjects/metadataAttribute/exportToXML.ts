import { v4 } from "uuid"
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
  configurationSettings: ConfigurationSettings,
  data: MetadataAttribute | undefined
): MetadataAttributeXML | undefined => {
  if (!data) return undefined

  const result: MetadataAttributeXML = {
    _uuid: v4(),
    Properties: compactObject<MetadataAttributeXML["Properties"]>({
      BinaryDataStorageLocationUse: data.binaryDataStorageLocationUse,
      BinaryDataStorageLocationUseField: data.binaryDataStorageLocationUseField,
      ChoiceFoldersAndItems: data.choiceFoldersAndItems,
      ChoiceForm: data.choiceForm,
      ChoiceHistoryOnInput: data.choiceHistoryOnInput,
      ChoiceParameterLinks: exportChoiceParameterLinksToXML(configurationSettings, data.choiceParameterLinks),
      ChoiceParameters: exportChoiceParameterLinksToXML(configurationSettings, data.choiceParameters),
      Comment: data.comment,
      CreateOnInput: data.createOnInput,
      DataHistory: data.dataHistory,
      EditFormat: exportI8nTextToXML(configurationSettings, data.editFormat),
      ExtendedEdit: data.extendedEdit,
      FillChecking: data.fillChecking,
      FillFromFillingValue: data.fillFromFillingValue,
      FillingValue: exportMetadataValueToXML(configurationSettings, data.fillingValue),
      Format: exportI8nTextToXML(configurationSettings, data.format),
      FullTextSearch: data.fullTextSearch,
      Indexing: data.indexing,
      LinkByType: exportTypeLinkToXML(configurationSettings, data.linkByType),
      MarkNegatives: data.markNegatives,
      Mask: data.mask,
      MaxValue: data.maxValue,
      MinValue: data.minValue,
      MultiLine: data.multiLine,
      Name: data.name!,
      ObjectBelonging: data.objectBelonging,
      PasswordMode: data.passwordMode,
      QuickChoice: data.quickChoice,
      Synonym: exportI8nTextToXML(configurationSettings, data.synonym),
      Tooltip: exportI8nTextToXML(configurationSettings, data.tooltip),
      Type: exportTypeDescriptionToXML(configurationSettings, data.type)!,
      Use: data.use,
    })!,
  }

  return result
}

export const exportMetadataAttributesToXML = (
  configurationSettings: ConfigurationSettings,
  data: MetadataAttributes | undefined
): MetadataAttributesXML | undefined => {
  if (!data) return undefined

  const result = data.map((value: MetadataAttribute) => exportMetadataAttributeToXML(configurationSettings, value)!)

  return result.length === 1 ? result[0] : result
}
