import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import {
  MetadataAttribute,
  MetadataAttributes,
  MetadataAttributesXML,
  MetadataAttributeXML,
} from "~/lib/metadata/commonObjects/metadataAttribute/types"
import { importMetadataValueFromXML } from "~/lib/metadata/commonObjects/metadataValue/importFromXML"
import { importTypeDescriptionFromXML } from "~/lib/metadata/commonObjects/typeDescription/importFromXML"
import { importTypeLinkFromXML } from "~/lib/metadata/commonObjects/typeLink/importFromXML"
import { importChoiceParameterLinksFromXML } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { compactObject, removeDefaults } from "~/lib/metadata/helpers/compactObject"
import { importBooleanFromXML } from "../boolean/importFromXML"
import { getDefaults } from "./defaults"

export const importMetadataAttributeFromXML = (
  context: Context,
  xml: MetadataAttributeXML | undefined
): MetadataAttribute | undefined => {
  if (!xml) return undefined

  const props = xml.Properties

  const result = {
    binaryDataStorageLocationUse: props.BinaryDataStorageLocationUse,
    binaryDataStorageLocationUseField: importBooleanFromXML(context, props.BinaryDataStorageLocationUseField),
    choiceFoldersAndItems: props.ChoiceFoldersAndItems,
    choiceForm: props.ChoiceForm,
    choiceHistoryOnInput: props.ChoiceHistoryOnInput,
    choiceParameterLinks: importChoiceParameterLinksFromXML(context, props.ChoiceParameterLinks),
    choiceParameters: importChoiceParameterLinksFromXML(context, props.ChoiceParameters),
    comment: props.Comment,
    createOnInput: props.CreateOnInput,
    dataHistory: props.DataHistory,
    editFormat: importI8nTextFromXML(context, props.EditFormat),
    extendedEdit: importBooleanFromXML(context, props.ExtendedEdit),
    fillChecking: props.FillChecking,
    fillFromFillingValue: importBooleanFromXML(context, props.FillFromFillingValue),
    fillingValue: importMetadataValueFromXML(context, props.FillingValue),
    format: importI8nTextFromXML(context, props.Format),
    fullTextSearch: props.FullTextSearch,
    indexing: props.Indexing,
    linkByType: importTypeLinkFromXML(context, props.LinkByType),
    markNegatives: importBooleanFromXML(context, props.MarkNegatives),
    mask: props.Mask,
    maxValue: props.MaxValue,
    minValue: props.MinValue,
    multiLine: importBooleanFromXML(context, props.MultiLine),
    name: props.Name!,
    objectBelonging: props.ObjectBelonging,
    passwordMode: importBooleanFromXML(context, props.PasswordMode),
    quickChoice: props.QuickChoice,
    synonym: importI8nTextFromXML(context, props.Synonym),
    tooltip: importI8nTextFromXML(context, props.Tooltip),
    type: importTypeDescriptionFromXML(context, props.Type)!,
    use: props.Use,
  }

  const compactedResult = compactObject(result)

  const defaults = getDefaults(compactedResult, context)

  return removeDefaults(compactedResult, defaults)
}

export const importMetadataAttributesFromXML = (
  context: Context,
  xml: MetadataAttributesXML | undefined
): MetadataAttributes | undefined => {
  if (!xml) return undefined

  const items = Array.isArray(xml) ? xml : [xml]

  return items.map((value: MetadataAttributeXML) => importMetadataAttributeFromXML(context, value)!)
}
