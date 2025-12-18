import {
  MetadataCommand,
  MetadataCommands,
  MetadataCommandsXML,
  MetadataCommandXML,
} from "~/lib/metadata/appliedObjects/metadataCommand/types"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportMetadataCommandGroupToXML } from "~/lib/metadata/commonObjects/metadataCommandGroup/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportTypeDescriptionToXML } from "~/lib/metadata/commonObjects/typeDescription/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"

export const exportMetadataCommandToXML = (
  data: MetadataCommand | undefined,
  configurationSettings: ConfigurationSettings
): MetadataCommandXML | undefined => {
  if (!data) return undefined

  return {
    CommandParameterType: exportTypeDescriptionToXML(data.commandParameterType, configurationSettings),
    Comment: data.comment,
    Group: exportMetadataCommandGroupToXML(data.group, configurationSettings),
    ModifiesData: data.modifiesData,
    Name: data.name,
    ObjectBelonging: data.objectBelonging,
    ParameterUsageMode: data.parameterUsageMode,
    Picture: exportPictureToXML(data.picture, configurationSettings),
    Representation: data.representation,
    Shortcut: data.shortcut,
    Synonym: exportI8nTextToXML(data.synonym, configurationSettings),
    Tooltip: exportI8nTextToXML(data.tooltip, configurationSettings),
  }
}

export const exportMetadataCommandsToXML = (
  data: MetadataCommands | undefined,
  configurationSettings: ConfigurationSettings
): MetadataCommandsXML | undefined => {
  if (!data) return undefined

  return data.map((value: MetadataCommand) => exportMetadataCommandToXML(value, configurationSettings)!)
}
