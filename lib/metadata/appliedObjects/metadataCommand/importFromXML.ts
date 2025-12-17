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

export const importMetadataCommandFromXML = (xml: MetadataCommandXML | undefined): MetadataCommand | undefined => {
  if (!xml) return undefined

  return {
    commandParameterType: importTypeDescriptionFromXML(xml.CommandParameterType),
    comment: xml.Comment,
    group: importMetadataCommandGroupFromXML(xml.Group),
    modifiesData: xml.ModifiesData,
    name: xml.Name,
    objectBelonging: xml.ObjectBelonging,
    parameterUsageMode: xml.ParameterUsageMode,
    picture: importPictureFromXML(xml.Picture),
    representation: xml.Representation,
    shortcut: xml.Shortcut,
    synonym: importI8nTextFromXML(xml.Synonym),
    tooltip: importI8nTextFromXML(xml.Tooltip),
  }
}

export const importMetadataCommandsFromXML = (xml: MetadataCommandsXML | undefined): MetadataCommands | undefined => {
  if (!xml) return undefined

  return xml.map((value: MetadataCommandXML) => importMetadataCommandFromXML(value)!)
}
