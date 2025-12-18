import {
  MetadataCommand,
  MetadataCommands,
  MetadataCommandsXML,
  MetadataCommandXML,
} from "~/lib/metadata/appliedObjects/metadataCommand/types"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importMetadataCommandGroupFromXML } from "~/lib/metadata/commonObjects/metadataCommandGroup/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importTypeDescriptionFromXML } from "~/lib/metadata/commonObjects/typeDescription/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"

export const importMetadataCommandFromXML = (
  xml: MetadataCommandXML | undefined,
  configurationSettings: ConfigurationSettings
): MetadataCommand | undefined => {
  if (!xml) return undefined

  return {
    commandParameterType: importTypeDescriptionFromXML(xml.CommandParameterType, configurationSettings),
    comment: xml.Comment,
    group: importMetadataCommandGroupFromXML(xml.Group, configurationSettings),
    modifiesData: xml.ModifiesData,
    name: xml.Name,
    objectBelonging: xml.ObjectBelonging,
    parameterUsageMode: xml.ParameterUsageMode,
    picture: importPictureFromXML(xml.Picture, configurationSettings),
    representation: xml.Representation,
    shortcut: xml.Shortcut,
    synonym: importI8nTextFromXML(xml.Synonym, configurationSettings),
    tooltip: importI8nTextFromXML(xml.Tooltip, configurationSettings),
  }
}

export const importMetadataCommandsFromXML = (
  xml: MetadataCommandsXML | undefined,
  configurationSettings: ConfigurationSettings
): MetadataCommands | undefined => {
  if (!xml) return undefined

  return xml.map((value: MetadataCommandXML) => importMetadataCommandFromXML(value, configurationSettings)!)
}
