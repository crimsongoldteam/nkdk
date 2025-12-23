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
  configurationSettings: Context,
  xml: MetadataAttributeXML | undefined
): MetadataAttribute | undefined => {
  if (!xml) return undefined

  const props = xml.Properties

  const result = {
    binaryDataStorageLocationUse: props.BinaryDataStorageLocationUse,
    binaryDataStorageLocationUseField: importBooleanFromXML(
      configurationSettings,
      props.BinaryDataStorageLocationUseField
    ),
    choiceFoldersAndItems: props.ChoiceFoldersAndItems,
    choiceForm: props.ChoiceForm,
    choiceHistoryOnInput: props.ChoiceHistoryOnInput,
    choiceParameterLinks: importChoiceParameterLinksFromXML(configurationSettings, props.ChoiceParameterLinks),
    choiceParameters: importChoiceParameterLinksFromXML(configurationSettings, props.ChoiceParameters),
    comment: props.Comment,
    createOnInput: props.CreateOnInput,
    dataHistory: props.DataHistory,
    editFormat: importI8nTextFromXML(configurationSettings, props.EditFormat),
    extendedEdit: importBooleanFromXML(configurationSettings, props.ExtendedEdit),
    fillChecking: props.FillChecking,
    fillFromFillingValue: importBooleanFromXML(configurationSettings, props.FillFromFillingValue),
    fillingValue: importMetadataValueFromXML(configurationSettings, props.FillingValue),
    format: importI8nTextFromXML(configurationSettings, props.Format),
    fullTextSearch: props.FullTextSearch,
    indexing: props.Indexing,
    linkByType: importTypeLinkFromXML(configurationSettings, props.LinkByType),
    markNegatives: importBooleanFromXML(configurationSettings, props.MarkNegatives),
    mask: props.Mask,
    maxValue: props.MaxValue,
    minValue: props.MinValue,
    multiLine: importBooleanFromXML(configurationSettings, props.MultiLine),
    name: props.Name!,
    objectBelonging: props.ObjectBelonging,
    passwordMode: importBooleanFromXML(configurationSettings, props.PasswordMode),
    quickChoice: props.QuickChoice,
    synonym: importI8nTextFromXML(configurationSettings, props.Synonym),
    tooltip: importI8nTextFromXML(configurationSettings, props.Tooltip),
    type: importTypeDescriptionFromXML(configurationSettings, props.Type)!,
    use: props.Use,
  }

  const compactedResult = compactObject(result)

  const defaults = getDefaults(compactedResult, configurationSettings)

  return removeDefaults(compactedResult, defaults)
}

export const importMetadataAttributesFromXML = (
  configurationSettings: Context,
  xml: MetadataAttributesXML | undefined
): MetadataAttributes | undefined => {
  if (!xml) return undefined

  const items = Array.isArray(xml) ? xml : [xml]

  return items.map((value: MetadataAttributeXML) => importMetadataAttributeFromXML(configurationSettings, value)!)
}
