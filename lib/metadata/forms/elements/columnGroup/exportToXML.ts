import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportFormGroupToXML } from "../formGroup/exportToXML"
import { TColumnGroupXML, TColumnGroup } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportColumnGroupToXML = (data: TColumnGroup | undefined): TColumnGroupXML | undefined => {
  if (!data) return undefined

  const base = exportFormGroupToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    FixingInTable: data.fixingInTable,
    Group: data.group,
    HeaderDataPath: data.headerDataPath,
    HeaderFormat: data.headerFormat,
    HeaderHorizontalAlign: data.headerHorizontalAlign,
    HeaderPicture: exportPictureToXML(data.headerPicture),
    ShowInHeader: data.showInHeader,
    ShowTitle: data.showTitle,
    TitleBackColor: exportColorToXML(data.titleBackColor),
  }
}

registerExport(ZElementType.enum.ColumnGroup, exportColumnGroupToXML)