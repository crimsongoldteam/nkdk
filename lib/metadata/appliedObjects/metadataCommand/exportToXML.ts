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

export const exportMetadataCommandToXML = (data: MetadataCommand | undefined): MetadataCommandXML | undefined => {
  if (!data) return undefined

  return {
    CommandParameterType: exportTypeDescriptionToXML(data.commandParameterType),
    Comment: data.comment,
    Group: exportMetadataCommandGroupToXML(data.group),
    ModifiesData: data.modifiesData,
    Name: data.name,
    ObjectBelonging: data.objectBelonging,
    ParameterUsageMode: data.parameterUsageMode,
    Picture: exportPictureToXML(data.picture),
    Representation: data.representation,
    Shortcut: data.shortcut,
    Synonym: exportI8nTextToXML(data.synonym),
    Tooltip: exportI8nTextToXML(data.tooltip),
  }
}

export const exportMetadataCommandsToXML = (data: MetadataCommands | undefined): MetadataCommandsXML | undefined => {
  if (!data) return undefined

  return data.map((value: MetadataCommand) => exportMetadataCommandToXML(value)!)
}
