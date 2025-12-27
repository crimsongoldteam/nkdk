import { exportColorToXML } from "~/packages/core/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/packages/core/metadata/commonObjects/pictures/exportToXML"
import { exportUserVisibleToXML } from "~/packages/core/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/packages/core/metadata/context/types"
import { ColumnGroup, ColumnGroupXML } from "~/packages/core/metadata/forms/elements/columnGroup/types"
import { exportFormGroupToXML } from "~/packages/core/metadata/forms/elements/formGroup/exportToXML"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"

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
