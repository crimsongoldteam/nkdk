import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import {
  MetadataAttribute,
  MetadataAttributes,
  MetadataAttributesXML,
  MetadataAttributeXML,
} from "~/metadata/commonObjects/metadataAttribute/types"
import { importMetadataValueFromXML } from "~/metadata/commonObjects/metadataValue/importFromXML"
import { importTypeDescriptionFromXML } from "~/metadata/commonObjects/typeDescription/importFromXML"
import { importTypeLinkFromXML } from "~/metadata/commonObjects/typeLink/importFromXML"
import { importChoiceParameterLinksFromXML } from "~/metadata/commonObjects/сhoiceParameterLinks/importFromXML"
import { Context } from "~/metadata/context/types"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { importBooleanFromXML } from "../boolean/importFromXML"
import { importMetadataValueFromXMLAsPrimitive } from "../metadataValue/importFromXML.ts"
import { importChoiceParametersFromXML } from "../сhoiceParameters/importFromXML.ts"
import { getDefaultsAttribute } from "./defaults"

export const importMetadataAttributesFromXML = (
  context: Context,
  xml: MetadataAttributesXML | undefined
): MetadataAttributes | undefined => {
  if (!xml) return undefined

  const items = Array.isArray(xml) ? xml : [xml]

  return items.map((value: MetadataAttributeXML) => importMetadataAttributeFromXML(context, value)!)
}

const importMetadataAttributeFromXML = (context: Context, xml: MetadataAttributeXML): MetadataAttribute => {
  const props = xml.Properties

  const result: MetadataAttribute = {} as MetadataAttribute

  if (props.BinaryDataStorageLocationUse !== undefined)
    result.binaryDataStorageLocationUse = props.BinaryDataStorageLocationUse

  const binaryDataStorageLocationUseField = importBooleanFromXML(context, props.BinaryDataStorageLocationUseField)
  if (binaryDataStorageLocationUseField !== undefined)
    result.binaryDataStorageLocationUseField = binaryDataStorageLocationUseField

  if (props.ChoiceFoldersAndItems !== undefined) result.choiceFoldersAndItems = props.ChoiceFoldersAndItems

  if (props.ChoiceForm !== undefined) result.choiceForm = props.ChoiceForm

  if (props.ChoiceHistoryOnInput !== undefined) result.choiceHistoryOnInput = props.ChoiceHistoryOnInput

  const choiceParameterLinks = importChoiceParameterLinksFromXML(context, props.ChoiceParameterLinks)
  if (choiceParameterLinks) result.choiceParameterLinks = choiceParameterLinks

  const choiceParameters = importChoiceParametersFromXML(context, props.ChoiceParameters)
  if (choiceParameters) result.choiceParameters = choiceParameters

  if (props.Comment !== undefined) result.comment = props.Comment

  if (props.CreateOnInput !== undefined) result.createOnInput = props.CreateOnInput

  if (props.DataHistory !== undefined) result.dataHistory = props.DataHistory

  const editFormat = importI8nTextFromXML(context, props.EditFormat)
  if (editFormat) result.editFormat = editFormat

  const extendedEdit = importBooleanFromXML(context, props.ExtendedEdit)
  if (extendedEdit !== undefined) result.extendedEdit = extendedEdit

  if (props.FillChecking !== undefined) result.fillChecking = props.FillChecking

  const fillFromFillingValue = importBooleanFromXML(context, props.FillFromFillingValue)
  if (fillFromFillingValue !== undefined) result.fillFromFillingValue = fillFromFillingValue

  const fillValue = importMetadataValueFromXML(context, props.FillValue)
  if (fillValue) result.fillValue = fillValue

  const format = importI8nTextFromXML(context, props.Format)
  if (format) result.format = format

  if (props.FullTextSearch !== undefined) result.fullTextSearch = props.FullTextSearch

  if (props.Indexing !== undefined) result.indexing = props.Indexing

  const linkByType = importTypeLinkFromXML(context, props.LinkByType)
  if (linkByType) result.linkByType = linkByType

  const markNegatives = importBooleanFromXML(context, props.MarkNegatives)
  if (markNegatives !== undefined) result.markNegatives = markNegatives

  if (props.Mask !== undefined) result.mask = String(props.Mask)

  const maxValue = importMetadataValueFromXMLAsPrimitive(context, props.MaxValue, "decimal") as number | undefined
  if (maxValue !== undefined) result.maxValue = maxValue

  const minValue = importMetadataValueFromXMLAsPrimitive(context, props.MinValue, "decimal") as number | undefined
  if (minValue !== undefined) result.minValue = minValue

  const multiLine = importBooleanFromXML(context, props.MultiLine)
  if (multiLine !== undefined) result.multiLine = multiLine

  result.name = props.Name!

  const passwordMode = importBooleanFromXML(context, props.PasswordMode)
  if (passwordMode !== undefined) result.passwordMode = passwordMode

  if (props.QuickChoice !== undefined) result.quickChoice = props.QuickChoice

  const synonym = importI8nTextFromXML(context, props.Synonym)
  if (synonym == undefined) result.synonym = { items: { [context.defaultLanguage]: "" } }
  else result.synonym = synonym

  const toolTip = importI8nTextFromXML(context, props.ToolTip)
  if (toolTip !== undefined) result.toolTip = toolTip

  result.type = importTypeDescriptionFromXML(context, props.Type)!

  if (props.Use !== undefined) result.use = props.Use

  const defaults = getDefaultsAttribute(context, result)

  return removeDefaults(result, defaults)
}
