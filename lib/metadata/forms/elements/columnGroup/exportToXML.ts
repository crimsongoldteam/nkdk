import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/lib/metadata/context/types"
import { ColumnGroup, ColumnGroupXML } from "~/lib/metadata/forms/elements/columnGroup/types"
import { exportFormGroupToXML } from "~/lib/metadata/forms/elements/formGroup/exportToXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

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
