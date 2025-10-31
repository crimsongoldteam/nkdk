import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportFormGroupToXML } from "../formGroup/exportToXML"
import { TColumnGroupXML, TColumnGroup } from "./types"

export const exportColumnGroupToXML = (data: TColumnGroup | undefined): TColumnGroupXML | undefined => {
  if (!data) return undefined

  const base = exportFormGroupToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    HeaderHorizontalAlign: data.headerHorizontalAlign,
    Group: data.group,
    HeaderPicture: exportPictureToXML(data.headerPicture),
    ShowInHeader: data.showInHeader,
    ShowTitle: data.showTitle,
    HeaderDataPath: data.headerDataPath,
    FixingInTable: data.fixingInTable,
    HeaderFormat: data.headerFormat,
    TitleBackColor: exportColorToXML(data.titleBackColor),
  }
}