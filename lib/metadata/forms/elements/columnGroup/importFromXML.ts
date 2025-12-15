import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { importFormGroupFromXML } from "~/lib/metadata/forms/elements/formGroup/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { FormElementType } from "../types"

export const importColumnGroupFromXML = (xml: ColumnGroupXML | undefined): ColumnGroup | undefined => {
  if (!xml) return undefined

  return {
    ...importFormGroupFromXML(xml)!,
    elementType: FormElementType.ColumnGroup,

    fixingInTable: xml.FixingInTable,
    group: xml.Group,
    headerDataPath: xml.HeaderDataPath,
    headerFormat: xml.HeaderFormat,
    headerHorizontalAlign: xml.HeaderHorizontalAlign,
    headerPicture: importPictureFromXML(xml.HeaderPicture),
    showInHeader: xml.ShowInHeader,
    showTitle: xml.ShowTitle,
    titleBackColor: importColorFromXML(xml.TitleBackColor),
    userVisible: importUserVisibleFromXML(xml.UserVisible),
  }
}

registerImport(FormElementType.ColumnGroup, importColumnGroupFromXML)
