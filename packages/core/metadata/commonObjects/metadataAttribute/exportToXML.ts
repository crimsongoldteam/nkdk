import { v4 } from "uuid"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import {
  MetadataAttribute,
  MetadataAttributes,
  MetadataAttributesXML,
  MetadataAttributeXML,
} from "~/metadata/commonObjects/metadataAttribute/types"
import {
  exportMetadataSimpleValueToXML,
  exportMetadataValueToXML,
} from "~/metadata/commonObjects/metadataValue/exportToXML"
import { exportTypeDescriptionToXML } from "~/metadata/commonObjects/typeDescription/exportToXML"
import { exportTypeLinkToXML } from "~/metadata/commonObjects/typeLink/exportToXML"
import { exportChoiceParameterLinksToXML } from "~/metadata/commonObjects/сhoiceParameterLinks/exportToXML"
import { Context } from "~/metadata/context/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { exportChoiceParametersToXML } from "../сhoiceParameter/exportToXML"
import { getDefaults } from "./defaults"

export const exportMetadataAttributeToXML = (
  context: Context,
  data: MetadataAttribute | undefined
): MetadataAttributeXML | undefined => {
  if (!data) return undefined

  const defaults = getDefaults(data, context)
  const mergedData: MetadataAttribute = { ...defaults, ...data }

  const result: MetadataAttributeXML = {
    _uuid: v4(),
    Properties: compactObject<MetadataAttributeXML["Properties"]>({
      BinaryDataStorageLocationUse: mergedData.binaryDataStorageLocationUse,
      BinaryDataStorageLocationUseField: mergedData.binaryDataStorageLocationUseField,
      ChoiceFoldersAndItems: mergedData.choiceFoldersAndItems,
      ChoiceForm: mergedData.choiceForm,
      ChoiceHistoryOnInput: mergedData.choiceHistoryOnInput,
      ChoiceParameterLinks: exportChoiceParameterLinksToXML(context, mergedData.choiceParameterLinks),
      ChoiceParameters: exportChoiceParametersToXML(context, mergedData.choiceParameters),
      Comment: mergedData.comment,
      CreateOnInput: mergedData.createOnInput,
      DataHistory: mergedData.dataHistory,
      EditFormat: exportI8nTextToXML(context, mergedData.editFormat),
      ExtendedEdit: mergedData.extendedEdit,
      FillChecking: mergedData.fillChecking,
      FillFromFillingValue: mergedData.fillFromFillingValue,
      FillValue: exportMetadataValueToXML(context, mergedData.fillValue),
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
      ToolTip: exportI8nTextToXML(context, mergedData.toolTip),
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
