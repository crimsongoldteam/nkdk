import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importFormGroupFromXML } from "../formGroup/importFromXML"
import { TColumnGroupXML, TColumnGroup } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importColumnGroupFromXML = (xml: TColumnGroupXML | undefined): TColumnGroup | undefined => {
  if (!xml) return undefined

  const base = importFormGroupFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.ColumnGroup,
    headerHorizontalAlign: xml.HeaderHorizontalAlign,
    group: xml.Group,
    headerPicture: importPictureFromXML(xml.HeaderPicture),
    showInHeader: xml.ShowInHeader,
    showTitle: xml.ShowTitle,
    headerDataPath: xml.HeaderDataPath,
    fixingInTable: xml.FixingInTable,
    headerFormat: xml.HeaderFormat,
    titleBackColor: importColorFromXML(xml.TitleBackColor),
  }
}

registerImport(ZElementType.enum.ColumnGroup, importColumnGroupFromXML)