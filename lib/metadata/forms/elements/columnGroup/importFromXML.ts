import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { ColumnGroup, ColumnGroupXML } from "~/lib/metadata/forms/elements/columnGroup/types"
import { importFormGroupFromXML } from "~/lib/metadata/forms/elements/formGroup/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importColumnGroupFromXML = (
  configurationSettings: ConfigurationSettings, xml: ColumnGroupXML | undefined
): ColumnGroup | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormGroupFromXML(configurationSettings, xml)!,
    elementType: FormElementType.ColumnGroup,

    fixingInTable: xml.FixingInTable,
    group: xml.Group,
    headerDataPath: xml.HeaderDataPath,
    headerFormat: xml.HeaderFormat,
    headerHorizontalAlign: xml.HeaderHorizontalAlign,
    headerPicture: importPictureFromXML(configurationSettings, xml.HeaderPicture),
    showInHeader: xml.ShowInHeader,
    showTitle: xml.ShowTitle,
    titleBackColor: importColorFromXML(configurationSettings, xml.TitleBackColor),
    userVisible: importUserVisibleFromXML(configurationSettings, xml.UserVisible),
  })
}

registerMetadata("ImportFromXML", "ColumnGroup", importColumnGroupFromXML)
