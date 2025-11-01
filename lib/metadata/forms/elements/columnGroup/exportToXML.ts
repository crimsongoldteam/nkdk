import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportFormGroupToXML } from "../formGroup/exportToXML"
import { TColumnGroupXML, TColumnGroup } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"
import { sortObjectByKeys } from "~/lib/xml/export/sortObjectKeys"

const ORDER = ["Visible", "UserVisible", "Enabled", "ReadOnly", "EnableContentChange", "Title", "TitleTextColor", "TitleFont", "ToolTip", "ToolTipRepresentation", "Width", "Height", "HorizontalStretch", "VerticalStretch", "Group", "TitleBackColor", "ShowInHeader", "HeaderDataPath", "HeaderHorizontalAlign", "HeaderPicture", "HeaderFormat", "FixingInTable", "ExtendedTooltip"]

export const exportColumnGroupToXML = (data: TColumnGroup | undefined): TColumnGroupXML | undefined => {
  if (!data) return undefined

  const base = exportFormGroupToXML(data)
  if (!base) return undefined
   
  return sortObjectByKeys<TColumnGroupXML>( {
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
  }, ORDER)
}

registerExport(ZElementType.enum.ColumnGroup, exportColumnGroupToXML)