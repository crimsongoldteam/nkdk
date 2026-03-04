import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/toXML"
import {
    MetadataAttribute,
    MetadataAttributes,
    MetadataAttributesXML,
    MetadataAttributeXML,
} from "~/metadata/commonObjects/metadataAttribute/types"
import { exportMetadataSimpleValueToXML, exportMetadataValueToXML } from "~/metadata/commonObjects/metadataValue/toXML"
import { exportTypeDescriptionToXML } from "~/metadata/commonObjects/typeDescription/toXML"
import { exportChoiceParameterLinksToXML } from "~/metadata/commonObjects/сhoiceParameterLinks/toXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory"
import { getUUID } from "../../helpers/uuid"
import { exportTypeLinkToXML } from "../typeLink/toXML"
import { exportChoiceParametersToXML } from "../сhoiceParameters/toXML"
import { getDefaultsAttribute, getDefaultsTabularSectionAttribute } from "./defaults"

export const exportMetadataAttributesToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataAttributes | undefined
): MetadataAttributesXML | undefined => {
  if (!data) return undefined

  const result = data.map(
    (value: MetadataAttribute) =>
      exportMetadataAttributeToXML(context, undefined, value, getDefaultsAttribute(context, value))!
  )

  return result
}

export const exportMetadataTabularSectionAttributesToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataAttributes | undefined
): MetadataAttributesXML | undefined => {
  if (!data) return undefined

  const result = data.map(
    (value: MetadataAttribute) =>
      exportMetadataAttributeToXML(context, undefined, value, getDefaultsTabularSectionAttribute(context, value))!
  )

  return result
}

const exportMetadataAttributeToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataAttribute,
  defaults: Partial<MetadataAttribute>
): MetadataAttributeXML => {
  const mergedData = { ...defaults, ...data }

  const type = exportTypeDescriptionToXML(context, undefined, mergedData.type)!

  const result: MetadataAttributeXML = {
    _uuid: getUUID(context),
    Properties: {} as MetadataAttributeXML["Properties"],
  }

  if (mergedData.binaryDataStorageLocationUse !== undefined)
    result.Properties.BinaryDataStorageLocationUse = mergedData.binaryDataStorageLocationUse

  if (mergedData.binaryDataStorageLocationUseField !== undefined)
    result.Properties.BinaryDataStorageLocationUseField = mergedData.binaryDataStorageLocationUseField

  result.Properties.ChoiceFoldersAndItems = mergedData.choiceFoldersAndItems

  if (mergedData.choiceForm !== undefined) result.Properties.ChoiceForm = mergedData.choiceForm

  result.Properties.ChoiceHistoryOnInput = mergedData.choiceHistoryOnInput

  const choiceParameterLinks = exportChoiceParameterLinksToXML(context, undefined, mergedData.choiceParameterLinks)
  if (choiceParameterLinks) result.Properties.ChoiceParameterLinks = choiceParameterLinks

  const choiceParameters = exportChoiceParametersToXML(context, undefined, mergedData.choiceParameters)
  if (choiceParameters) result.Properties.ChoiceParameters = choiceParameters

  if (mergedData.comment !== undefined) result.Properties.Comment = mergedData.comment

  result.Properties.CreateOnInput = mergedData.createOnInput

  result.Properties.DataHistory = mergedData.dataHistory

  const editFormat = exportI8nTextToXML(context, { type: "I8nText" }, mergedData.editFormat)
  if (editFormat) result.Properties.EditFormat = editFormat

  result.Properties.ExtendedEdit = mergedData.extendedEdit

  result.Properties.FillChecking = mergedData.fillChecking

  result.Properties.FillFromFillingValue = mergedData.fillFromFillingValue

  const fillValue = exportMetadataValueToXML(context, undefined, mergedData.fillValue)
  if (fillValue) result.Properties.FillValue = fillValue

  const format = exportI8nTextToXML(context, { type: "I8nText" }, mergedData.format)
  if (format) result.Properties.Format = format

  result.Properties.FullTextSearch = mergedData.fullTextSearch

  result.Properties.Indexing = mergedData.indexing

  const linkByType = exportTypeLinkToXML(context, undefined, mergedData.linkByType)
  if (linkByType) result.Properties.LinkByType = linkByType

  result.Properties.MarkNegatives = mergedData.markNegatives

  if (mergedData.mask !== undefined) result.Properties.Mask = mergedData.mask

  const maxValue = exportMetadataSimpleValueToXML(context, undefined, mergedData.maxValue, "string")
  if (maxValue) result.Properties.MaxValue = maxValue

  const minValue = exportMetadataSimpleValueToXML(context, undefined, mergedData.minValue, "string")
  if (minValue) result.Properties.MinValue = minValue

  result.Properties.MultiLine = mergedData.multiLine

  result.Properties.Name = mergedData.name

  result.Properties.PasswordMode = mergedData.passwordMode

  result.Properties.QuickChoice = mergedData.quickChoice

  result.Properties.Synonym = exportI8nTextToXML(context, { type: "I8nText" }, mergedData.synonym)!

  const toolTip = exportI8nTextToXML(context, { type: "I8nText" }, mergedData.toolTip)
  if (toolTip !== undefined) result.Properties.ToolTip = toolTip

  result.Properties.Type = type

  result.Properties.Use = mergedData.use

  return result
}

registerTypeRule("MetadataAttributes", "exportToXML", exportMetadataAttributesToXML)
