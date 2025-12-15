import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importTypeDescriptionFromXML } from "~/lib/metadata/commonObjects/typeDescription/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { FormElementType } from "../types"

export const importMetadataCommandFromXML = (xml: MetadataCommandXML | undefined): MetadataCommand | undefined => {
  if (!xml) return undefined

  return {
    elementType: FormElementType.MetadataCommand,

    commandModule: xml.CommandModule,
    commandParameterType: importTypeDescriptionFromXML(xml.CommandParameterType),
    comment: xml.Comment,
    extendedConfigurationObject: xml.ExtendedConfigurationObject,
    group: xml.Group,
    modifiesData: xml.ModifiesData,
    objectBelonging: xml.ObjectBelonging,
    parameterUsageMode: xml.ParameterUsageMode,
    picture: importPictureFromXML(xml.Picture),
    representation: xml.Representation,
    shortcut: xml.Shortcut,
    synonym: xml.Synonym,
    tooltip: xml.Tooltip,
  }
}

registerImport(FormElementType.MetadataCommand, importMetadataCommandFromXML)
