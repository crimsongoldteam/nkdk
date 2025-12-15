import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportMetadataCommandGroupToXML } from "~/lib/metadata/commonObjects/metadataCommandGroup/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportTypeDescriptionToXML } from "~/lib/metadata/commonObjects/typeDescription/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "../types"

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

registerExport(FormElementType.MetadataCommand, exportMetadataCommandToXML)
