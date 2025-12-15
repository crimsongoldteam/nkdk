import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { exportFormGroupToXML } from "~/lib/metadata/forms/elements/formGroup/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "../types"

export const exportColumnGroupToXML = (data: ColumnGroup | undefined): ColumnGroupXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormGroupToXML(data)!,

    FixingInTable: data.fixingInTable,
    Group: data.group,
    HeaderDataPath: data.headerDataPath,
    HeaderFormat: data.headerFormat,
    HeaderHorizontalAlign: data.headerHorizontalAlign,
    HeaderPicture: exportPictureToXML(data.headerPicture),
    ShowInHeader: data.showInHeader,
    ShowTitle: data.showTitle,
    TitleBackColor: exportColorToXML(data.titleBackColor),
    UserVisible: exportUserVisibleToXML(data.userVisible),
  }
}

registerExport(FormElementType.ColumnGroup, exportColumnGroupToXML)
