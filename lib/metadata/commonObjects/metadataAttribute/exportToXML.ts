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
import { Context } from "~/lib/metadata/context/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { getDefaults } from "./defaults"

export const exportMetadataAttributeToXML = (
  configurationSettings: Context,
  data: MetadataAttribute | undefined
): MetadataAttributeXML | undefined => {
  if (!data) return undefined

  const defaults = getDefaults(data, configurationSettings)
  const mergedData = { ...defaults, ...data }

  const result: MetadataAttributeXML = {
    _uuid: v4(),
    Properties: compactObject<MetadataAttributeXML["Properties"]>({
      BinaryDataStorageLocationUse: mergedData.binaryDataStorageLocationUse,
      BinaryDataStorageLocationUseField: mergedData.binaryDataStorageLocationUseField,
      ChoiceFoldersAndItems: mergedData.choiceFoldersAndItems,
      ChoiceForm: mergedData.choiceForm,
      ChoiceHistoryOnInput: mergedData.choiceHistoryOnInput,
      ChoiceParameterLinks: exportChoiceParameterLinksToXML(configurationSettings, mergedData.choiceParameterLinks),
      ChoiceParameters: exportChoiceParameterLinksToXML(configurationSettings, mergedData.choiceParameters),
      Comment: mergedData.comment,
      CreateOnInput: mergedData.createOnInput,
      DataHistory: mergedData.dataHistory,
      EditFormat: exportI8nTextToXML(configurationSettings, mergedData.editFormat),
      ExtendedEdit: mergedData.extendedEdit,
      FillChecking: mergedData.fillChecking,
      FillFromFillingValue: mergedData.fillFromFillingValue,
      FillingValue: exportMetadataValueToXML(configurationSettings, mergedData.fillingValue),
      Format: exportI8nTextToXML(configurationSettings, mergedData.format),
      FullTextSearch: mergedData.fullTextSearch,
      Indexing: mergedData.indexing,
      LinkByType: exportTypeLinkToXML(configurationSettings, mergedData.linkByType),
      MarkNegatives: mergedData.markNegatives,
      Mask: mergedData.mask,
      MaxValue: mergedData.maxValue,
      MinValue: mergedData.minValue,
      MultiLine: mergedData.multiLine,
      Name: mergedData.name!,
      ObjectBelonging: mergedData.objectBelonging,
      PasswordMode: mergedData.passwordMode,
      QuickChoice: mergedData.quickChoice,
      Synonym: exportI8nTextToXML(configurationSettings, mergedData.synonym),
      Tooltip: exportI8nTextToXML(configurationSettings, mergedData.tooltip),
      Type: exportTypeDescriptionToXML(configurationSettings, mergedData.type)!,
      Use: mergedData.use,
    })!,
  }

  return result
}

export const exportMetadataAttributesToXML = (
  configurationSettings: Context,
  data: MetadataAttributes | undefined
): MetadataAttributesXML | undefined => {
  if (!data) return undefined

  const result = data.map((value: MetadataAttribute) => exportMetadataAttributeToXML(configurationSettings, value)!)

  return result.length === 1 ? result[0] : result
}
