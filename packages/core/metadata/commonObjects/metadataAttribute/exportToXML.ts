import { v4 } from "uuid"
import { exportI8nTextToXML } from "~/packages/core/metadata/commonObjects/i8nText/exportToXML"
import {
  MetadataAttribute,
  MetadataAttributes,
  MetadataAttributesXML,
  MetadataAttributeXML,
} from "~/packages/core/metadata/commonObjects/metadataAttribute/types"
import {
  exportMetadataSimpleValueToXML,
  exportMetadataValueToXML,
} from "~/packages/core/metadata/commonObjects/metadataValue/exportToXML"
import { exportTypeDescriptionToXML } from "~/packages/core/metadata/commonObjects/typeDescription/exportToXML"
import { exportTypeLinkToXML } from "~/packages/core/metadata/commonObjects/typeLink/exportToXML"
import { exportChoiceParameterLinksToXML } from "~/packages/core/metadata/commonObjects/сhoiceParameterLinks/exportToXML"
import { Context } from "~/packages/core/metadata/context/types"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { getDefaults } from "./defaults"

export const exportMetadataAttributeToXML = (
  context: Context,
  data: MetadataAttribute | undefined
): MetadataAttributeXML | undefined => {
  if (!data) return undefined

  const defaults = getDefaults(data, context)
  const mergedData = { ...defaults, ...data }

  const result: MetadataAttributeXML = {
    _uuid: v4(),
    Properties: compactObject<MetadataAttributeXML["Properties"]>({
      BinaryDataStorageLocationUse: mergedData.binaryDataStorageLocationUse,
      BinaryDataStorageLocationUseField: mergedData.binaryDataStorageLocationUseField,
      ChoiceFoldersAndItems: mergedData.choiceFoldersAndItems,
      ChoiceForm: mergedData.choiceForm,
      ChoiceHistoryOnInput: mergedData.choiceHistoryOnInput,
      ChoiceParameterLinks: exportChoiceParameterLinksToXML(context, mergedData.choiceParameterLinks),
      ChoiceParameters: exportChoiceParameterLinksToXML(context, mergedData.choiceParameters),
      Comment: mergedData.comment,
      CreateOnInput: mergedData.createOnInput,
      DataHistory: mergedData.dataHistory,
      EditFormat: exportI8nTextToXML(context, mergedData.editFormat),
      ExtendedEdit: mergedData.extendedEdit,
      FillChecking: mergedData.fillChecking,
      FillFromFillingValue: mergedData.fillFromFillingValue,
      FillingValue: exportMetadataValueToXML(context, mergedData.fillingValue),
      Format: exportI8nTextToXML(context, mergedData.format),
      FullTextSearch: mergedData.fullTextSearch,
      Indexing: mergedData.indexing,
      LinkByType: exportTypeLinkToXML(context, mergedData.linkByType),
      MarkNegatives: mergedData.markNegatives,
      Mask: mergedData.mask,
      MaxValue: exportMetadataSimpleValueToXML(context, mergedData.maxValue, "string"),
      MinValue: exportMetadataSimpleValueToXML(context, mergedData.minValue, "string"),
      MultiLine: mergedData.multiLine,
      Name: mergedData.name!,
      ObjectBelonging: mergedData.objectBelonging,
      PasswordMode: mergedData.passwordMode,
      QuickChoice: mergedData.quickChoice,
      Synonym: exportI8nTextToXML(context, mergedData.synonym),
      Tooltip: exportI8nTextToXML(context, mergedData.tooltip),
      Type: exportTypeDescriptionToXML(context, mergedData.type)!,
      Use: mergedData.use,
    })!,
  }

  return result
}

export const exportMetadataAttributesToXML = (
  context: Context,
  data: MetadataAttributes | undefined
): MetadataAttributesXML | undefined => {
  if (!data) return undefined

  const result = data.map((value: MetadataAttribute) => exportMetadataAttributeToXML(context, value)!)

  return result.length === 1 ? result[0] : result
}
