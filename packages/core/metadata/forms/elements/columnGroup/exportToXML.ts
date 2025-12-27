import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/metadata/commonObjects/pictures/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/metadata/context/types"
import { ColumnGroup, ColumnGroupXML } from "~/metadata/forms/elements/columnGroup/types"
import { exportFormGroupToXML } from "~/metadata/forms/elements/formGroup/exportToXML"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportColumnGroupToXML = (context: Context, data: ColumnGroup | undefined): ColumnGroupXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToXML(context, data)!,

    FixingInTable: data.fixingInTable,
    Group: data.group,
    HeaderDataPath: data.headerDataPath,
    HeaderFormat: data.headerFormat,
    HeaderHorizontalAlign: data.headerHorizontalAlign,
    HeaderPicture: exportPictureToXML(context, data.headerPicture),
    ShowInHeader: data.showInHeader,
    ShowTitle: data.showTitle,
    TitleBackColor: exportColorToXML(context, data.titleBackColor),
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
  })
}

registerMetadata("ExportToXML", "ColumnGroup", exportColumnGroupToXML)
