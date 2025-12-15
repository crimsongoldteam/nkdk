import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportTypeDescriptionToXML } from "~/lib/metadata/commonObjects/typeDescription/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "../types"

export const exportMetadataCommandToXML = (data: MetadataCommand | undefined): MetadataCommandXML | undefined => {
  if (!data) return undefined

  return {
    CommandModule: data.commandModule,
    CommandParameterType: exportTypeDescriptionToXML(data.commandParameterType),
    Comment: data.comment,
    ExtendedConfigurationObject: data.extendedConfigurationObject,
    Group: data.group,
    ModifiesData: data.modifiesData,
    ObjectBelonging: data.objectBelonging,
    ParameterUsageMode: data.parameterUsageMode,
    Picture: exportPictureToXML(data.picture),
    Representation: data.representation,
    Shortcut: data.shortcut,
    Synonym: data.synonym,
    Tooltip: data.tooltip,
  }
}

registerExport(FormElementType.MetadataCommand, exportMetadataCommandToXML)
