import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importFormGroupFromXML } from "../formGroup/importFromXML"
import { TColumnsGroupXML, TColumnsGroup } from "./types"
import { ZElementType } from "../types"

export const importColumnsGroupFromXML = (xml: TColumnsGroupXML | undefined): TColumnsGroup | undefined => {
  if (!xml) return undefined

  const base = importFormGroupFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.ColumnsGroup,
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