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
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject, removeDefaults } from "~/lib/metadata/helpers/compactObject"
import { getDefaults } from "./defaults"

export const importMetadataAttributeFromXML = (
  xml: MetadataAttributeXML | undefined,
  configurationSettings: ConfigurationSettings
): MetadataAttribute | undefined => {
  if (!xml) return undefined

  const props = xml.Properties

  const result = {
    binaryDataStorageLocationUse: props.BinaryDataStorageLocationUse,
    binaryDataStorageLocationUseField: props.BinaryDataStorageLocationUseField,
    choiceFoldersAndItems: props.ChoiceFoldersAndItems,
    choiceForm: props.ChoiceForm,
    choiceHistoryOnInput: props.ChoiceHistoryOnInput,
    choiceParameterLinks: importChoiceParameterLinksFromXML(props.ChoiceParameterLinks, configurationSettings),
    choiceParameters: importChoiceParameterLinksFromXML(props.ChoiceParameters, configurationSettings),
    comment: props.Comment,
    createOnInput: props.CreateOnInput,
    dataHistory: props.DataHistory,
    editFormat: importI8nTextFromXML(props.EditFormat, configurationSettings),
    extendedEdit: props.ExtendedEdit,
    fillChecking: props.FillChecking,
    fillFromFillingValue: props.FillFromFillingValue,
    fillingValue: importMetadataValueFromXML(props.FillingValue, configurationSettings),
    format: importI8nTextFromXML(props.Format, configurationSettings),
    fullTextSearch: props.FullTextSearch,
    indexing: props.Indexing,
    linkByType: importTypeLinkFromXML(props.LinkByType, configurationSettings),
    markNegatives: props.MarkNegatives,
    mask: props.Mask,
    maxValue: props.MaxValue,
    minValue: props.MinValue,
    multiLine: props.MultiLine,
    name: props.Name!,
    objectBelonging: props.ObjectBelonging,
    passwordMode: props.PasswordMode,
    quickChoice: props.QuickChoice,
    synonym: importI8nTextFromXML(props.Synonym, configurationSettings),
    tooltip: importI8nTextFromXML(props.Tooltip, configurationSettings),
    type: importTypeDescriptionFromXML(props.Type, configurationSettings)!,
    use: props.Use,
  }

  const compactedResult = compactObject(result)

  const defaults = getDefaults(compactedResult, configurationSettings)

  return removeDefaults(compactedResult, defaults)
}

export const importMetadataAttributesFromXML = (
  xml: MetadataAttributesXML | undefined,
  configurationSettings: ConfigurationSettings
): MetadataAttributes | undefined => {
  if (!xml) return undefined

  const items = Array.isArray(xml) ? xml : [xml]

  return items.map((value: MetadataAttributeXML) => importMetadataAttributeFromXML(value, configurationSettings)!)
}
