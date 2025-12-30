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
import { exportChoiceParameterLinksToXML } from "~/metadata/commonObjects/сhoiceParameterLinks/exportToXML"
import { Context } from "~/metadata/context/types"
import { exportTypeLinkWithXSITypeToXML } from "../typeLink/exportToXML"
import { exportChoiceParametersToXML } from "../сhoiceParameter/exportToXML"
import { getDefaults } from "./defaults"

export const exportMetadataAttributeToXML = (context: Context, data: MetadataAttribute): MetadataAttributeXML => {
  const defaults = getDefaults(data, context)
  const mergedData = { ...defaults, ...data }

  const type = exportTypeDescriptionToXML(context, mergedData.type)!

  const result: MetadataAttributeXML = {
    _uuid: v4(),
    Properties: {} as MetadataAttributeXML["Properties"],
  }

  if (mergedData.binaryDataStorageLocationUse !== undefined)
    result.Properties.BinaryDataStorageLocationUse = mergedData.binaryDataStorageLocationUse

  if (mergedData.binaryDataStorageLocationUseField !== undefined)
    result.Properties.BinaryDataStorageLocationUseField = mergedData.binaryDataStorageLocationUseField

  result.Properties.ChoiceFoldersAndItems = mergedData.choiceFoldersAndItems

  if (mergedData.choiceForm !== undefined) result.Properties.ChoiceForm = mergedData.choiceForm

  result.Properties.ChoiceHistoryOnInput = mergedData.choiceHistoryOnInput

  const choiceParameterLinks = exportChoiceParameterLinksToXML(context, mergedData.choiceParameterLinks)
  if (choiceParameterLinks) result.Properties.ChoiceParameterLinks = choiceParameterLinks

  const choiceParameters = exportChoiceParametersToXML(context, mergedData.choiceParameters)
  if (choiceParameters) result.Properties.ChoiceParameters = choiceParameters

  if (mergedData.comment !== undefined) result.Properties.Comment = mergedData.comment

  result.Properties.CreateOnInput = mergedData.createOnInput

  result.Properties.DataHistory = mergedData.dataHistory

  const editFormat = exportI8nTextToXML(context, mergedData.editFormat)
  if (editFormat) result.Properties.EditFormat = editFormat

  result.Properties.ExtendedEdit = mergedData.extendedEdit

  result.Properties.FillChecking = mergedData.fillChecking

  result.Properties.FillFromFillingValue = mergedData.fillFromFillingValue

  const fillValue = exportMetadataValueToXML(context, mergedData.fillValue)
  if (fillValue) result.Properties.FillValue = fillValue

  const format = exportI8nTextToXML(context, mergedData.format)
  if (format) result.Properties.Format = format

  result.Properties.FullTextSearch = mergedData.fullTextSearch

  result.Properties.Indexing = mergedData.indexing

  const linkByType = exportTypeLinkWithXSITypeToXML(context, mergedData.linkByType)
  if (linkByType) result.Properties.LinkByType = linkByType

  result.Properties.MarkNegatives = mergedData.markNegatives

  if (mergedData.mask !== undefined) result.Properties.Mask = mergedData.mask

  const maxValue = exportMetadataSimpleValueToXML(context, mergedData.maxValue, "string")
  if (maxValue) result.Properties.MaxValue = maxValue

  const minValue = exportMetadataSimpleValueToXML(context, mergedData.minValue, "string")
  if (minValue) result.Properties.MinValue = minValue

  result.Properties.MultiLine = mergedData.multiLine

  result.Properties.Name = mergedData.name

  result.Properties.PasswordMode = mergedData.passwordMode

  result.Properties.QuickChoice = mergedData.quickChoice

  result.Properties.Synonym = exportI8nTextToXML(context, mergedData.synonym)!

  const toolTip = exportI8nTextToXML(context, mergedData.toolTip)
  if (toolTip !== undefined) result.Properties.ToolTip = toolTip

  result.Properties.Type = type

  result.Properties.Use = mergedData.use

  return result
}

export const exportMetadataAttributesToXML = (
  context: Context,
  data: MetadataAttributes | undefined
): MetadataAttributesXML | undefined => {
  if (!data) return undefined

  const result = data.map((value: MetadataAttribute) => exportMetadataAttributeToXML(context, value)!)

  return result
}
